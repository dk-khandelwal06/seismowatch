import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  // Test USGS API reachability
  let usgsStatus: "PASSED" | "FAILED" = "PASSED";
  let usgsLatencyMs = 0;
  let usgsError: string | null = null;

  try {
    const usgsStart = Date.now();
    const res = await fetch(
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1",
      {
        method: "HEAD",
        signal: AbortSignal.timeout(6000),
      }
    );
    usgsLatencyMs = Date.now() - usgsStart;
    if (!res.ok) {
      usgsStatus = "FAILED";
      usgsError = `HTTP ${res.status}`;
    }
  } catch (err: any) {
    usgsStatus = "FAILED";
    usgsError = err.message || "Connection timeout";
  }

  // Test database persistence status
  const dbHealth = await checkDatabaseHealth();

  const isHealthy = usgsStatus === "PASSED";

  return NextResponse.json(
    {
      status: isHealthy ? "HEALTHY" : "DEGRADED",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      upstream: {
        provider: "USGS Earthquake Hazards Program",
        api: "https://earthquake.usgs.gov/fdsnws/event/1/",
        status: usgsStatus,
        latencyMs: usgsLatencyMs,
        error: usgsError,
      },
      persistence: {
        type: "PostgreSQL with Drizzle ORM",
        status: dbHealth.status,
        configured: dbHealth.configured,
        connected: dbHealth.connected,
        message: dbHealth.message,
        totalStoredRecords: dbHealth.totalRecords ?? 0,
        lastIngestionRun: dbHealth.lastIngestionRun ?? null,
      },
      regionScope: {
        name: "Indian Subcontinent & Himalayan Seismic Belt",
        boundingBox: {
          latitude: "6°N to 38°N",
          longitude: "68°E to 98°E",
        },
      },
      version: "1.0.0",
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
