import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { Earthquake, EarthquakeFilterParams, IngestionRunRecord } from "@/types/earthquake";
import { and, desc, gte, ilike, lte, sql } from "drizzle-orm";

export interface DatabaseStatus {
  configured: boolean;
  connected: boolean;
  status: "PASSED" | "FAILED" | "BLOCKED";
  message: string;
  totalRecords?: number;
  lastIngestionRun?: IngestionRunRecord | null;
}

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

function getDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === "" || connectionString.includes("change_this")) {
    return null;
  }

  if (!dbInstance) {
    try {
      sqlClient = postgres(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 8,
        ssl: connectionString.includes("sslmode=require") ? "require" : undefined,
      });
      dbInstance = drizzle(sqlClient, { schema });
    } catch (err: any) {
      console.error("Database connection initialization failed:", err.message);
      return null;
    }
  }

  return dbInstance;
}

/**
 * Checks connectivity and returns system persistence health status.
 */
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  const db = getDatabaseClient();

  if (!db || !process.env.DATABASE_URL) {
    return {
      configured: false,
      connected: false,
      status: "BLOCKED",
      message:
        "PostgreSQL DATABASE_URL is not configured in environment. Database persistence is BLOCKED until configured.",
      totalRecords: 0,
      lastIngestionRun: null,
    };
  }

  try {
    const result = await db.execute(sql`SELECT 1 as health_check`);
    if (result) {
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(schema.earthquakes);
      const totalCount = Number(countResult[0]?.count || 0);

      const recentRuns = await db
        .select()
        .from(schema.ingestionRuns)
        .orderBy(desc(schema.ingestionRuns.startedAt))
        .limit(1);

      return {
        configured: true,
        connected: true,
        status: "PASSED",
        message: "PostgreSQL connection active and operational.",
        totalRecords: totalCount,
        lastIngestionRun: recentRuns.length > 0 ? (recentRuns[0] as unknown as IngestionRunRecord) : null,
      };
    }
  } catch (error: any) {
    return {
      configured: true,
      connected: false,
      status: "FAILED",
      message: `Database connection failed: ${error.message || "Unknown error"}`,
      totalRecords: 0,
      lastIngestionRun: null,
    };
  }

  return {
    configured: true,
    connected: false,
    status: "FAILED",
    message: "Unable to verify database connection.",
    totalRecords: 0,
    lastIngestionRun: null,
  };
}

/**
 * Idempotently upserts earthquake records into PostgreSQL using ON CONFLICT DO UPDATE.
 */
export async function upsertEarthquakes(events: Earthquake[]): Promise<{
  inserted: number;
  updated: number;
  totalProcessed: number;
}> {
  const db = getDatabaseClient();
  if (!db) {
    throw new Error(
      "Database persistence is BLOCKED: DATABASE_URL is not configured. Records cannot be stored."
    );
  }

  if (events.length === 0) {
    return { inserted: 0, updated: 0, totalProcessed: 0 };
  }

  let insertedCount = 0;
  let updatedCount = 0;

  // Process in chunks of 50 to prevent parameter limit overflow
  const chunkSize = 50;
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize);

    const values = chunk.map((e) => ({
      eventId: e.eventId,
      magnitude: e.magnitude,
      magnitudeType: e.magnitudeType,
      place: e.place,
      eventTime: new Date(e.eventTime),
      depthKm: e.depthKm,
      latitude: e.latitude,
      longitude: e.longitude,
      sourceUrl: e.sourceUrl,
      sourceUpdatedAt: e.sourceUpdatedAt ? new Date(e.sourceUpdatedAt) : null,
      lastSeenAt: new Date(),
    }));

    await db
      .insert(schema.earthquakes)
      .values(values)
      .onConflictDoUpdate({
        target: schema.earthquakes.eventId,
        set: {
          magnitude: sql`EXCLUDED.magnitude`,
          place: sql`EXCLUDED.place`,
          depthKm: sql`EXCLUDED.depth_km`,
          latitude: sql`EXCLUDED.latitude`,
          longitude: sql`EXCLUDED.longitude`,
          sourceUrl: sql`EXCLUDED.source_url`,
          sourceUpdatedAt: sql`EXCLUDED.source_updated_at`,
          lastSeenAt: sql`EXCLUDED.last_seen_at`,
        },
      });

    insertedCount += chunk.length;
  }

  return {
    inserted: insertedCount,
    updated: updatedCount,
    totalProcessed: events.length,
  };
}

/**
 * Query stored earthquakes with filtering and pagination.
 */
export async function getStoredEarthquakes(params: EarthquakeFilterParams = {}): Promise<{
  data: Earthquake[];
  total: number;
}> {
  const db = getDatabaseClient();
  if (!db) {
    return { data: [], total: 0 };
  }

  const conditions = [];

  if (params.search) {
    conditions.push(ilike(schema.earthquakes.place, `%${params.search}%`));
  }
  if (params.minMagnitude !== undefined) {
    conditions.push(gte(schema.earthquakes.magnitude, params.minMagnitude));
  }
  if (params.maxMagnitude !== undefined) {
    conditions.push(lte(schema.earthquakes.magnitude, params.maxMagnitude));
  }
  if (params.minDepth !== undefined) {
    conditions.push(gte(schema.earthquakes.depthKm, params.minDepth));
  }
  if (params.maxDepth !== undefined) {
    conditions.push(lte(schema.earthquakes.depthKm, params.maxDepth));
  }
  if (params.startDate) {
    conditions.push(gte(schema.earthquakes.eventTime, new Date(params.startDate)));
  }
  if (params.endDate) {
    conditions.push(lte(schema.earthquakes.eventTime, new Date(params.endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.earthquakes)
    .where(whereClause);
  const total = Number(countQuery[0]?.count || 0);

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 50));
  const offset = (page - 1) * limit;

  let orderByColumn = desc(schema.earthquakes.eventTime);
  if (params.sortBy === "magnitude") {
    orderByColumn =
      params.sortOrder === "asc"
        ? sql`${schema.earthquakes.magnitude} ASC`
        : sql`${schema.earthquakes.magnitude} DESC`;
  } else if (params.sortBy === "depthKm") {
    orderByColumn =
      params.sortOrder === "asc"
        ? sql`${schema.earthquakes.depthKm} ASC`
        : sql`${schema.earthquakes.depthKm} DESC`;
  }

  const rows = await db
    .select()
    .from(schema.earthquakes)
    .where(whereClause)
    .orderBy(orderByColumn)
    .limit(limit)
    .offset(offset);

  const data: Earthquake[] = rows.map((r) => ({
    eventId: r.eventId,
    magnitude: r.magnitude,
    magnitudeType: r.magnitudeType,
    place: r.place,
    eventTime: r.eventTime.toISOString(),
    eventTimeMs: r.eventTime.getTime(),
    depthKm: r.depthKm,
    latitude: r.latitude,
    longitude: r.longitude,
    sourceUrl: r.sourceUrl,
    sourceUpdatedAt: r.sourceUpdatedAt ? r.sourceUpdatedAt.toISOString() : null,
    firstSeenAt: r.firstSeenAt.toISOString(),
    lastSeenAt: r.lastSeenAt.toISOString(),
  }));

  return { data, total };
}

/**
 * Record an ingestion run in the database.
 */
export async function recordIngestionRun(run: {
  status: "SUCCESS" | "FAILED" | "RUNNING";
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  errorSummary?: string | null;
}): Promise<number | null> {
  const db = getDatabaseClient();
  if (!db) return null;

  try {
    const inserted = await db
      .insert(schema.ingestionRuns)
      .values({
        status: run.status,
        recordsReceived: run.recordsReceived,
        recordsInserted: run.recordsInserted,
        recordsUpdated: run.recordsUpdated,
        errorSummary: run.errorSummary || null,
        completedAt: run.status !== "RUNNING" ? new Date() : null,
      })
      .returning({ id: schema.ingestionRuns.id });

    return inserted[0]?.id ?? null;
  } catch (err: any) {
    console.error("Failed to record ingestion run:", err.message);
    return null;
  }
}
