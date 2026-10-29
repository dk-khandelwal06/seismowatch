import { NextRequest, NextResponse } from "next/server";
import { fetchUSGSEarthquakes } from "@/lib/usgs/client";
import {
  checkDatabaseHealth,
  upsertEarthquakes,
  recordIngestionRun,
} from "@/lib/database";

export const dynamic = "force-dynamic";

// In-memory rate-limiter for refresh requests: max 1 request every 30 seconds
let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 30 * 1000;

export async function POST(request: NextRequest) {
  const now = Date.now();

  // Check rate limit
  if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((REFRESH_COOLDOWN_MS - (now - lastRefreshTime)) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Manual refresh is on cooldown. Please wait ${remainingSeconds}s before refreshing again.`,
      },
      { status: 429 }
    );
  }

  // Authorization check: if INGESTION_SECRET_TOKEN is set in environment, check header
  const requiredToken = process.env.INGESTION_SECRET_TOKEN;
  const authHeader = request.headers.get("Authorization");
  if (
    requiredToken &&
    requiredToken !== "change_this_to_a_secure_random_token" &&
    authHeader !== `Bearer ${requiredToken}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing Bearer token" },
      { status: 401 }
    );
  }

  lastRefreshTime = now;

  try {
    // Fetch fresh observations from USGS
    const usgsResult = await fetchUSGSEarthquakes({ forceRefresh: true, limit: 250 });

    const dbHealth = await checkDatabaseHealth();
    let dbPersisted = false;
    let inserted = 0;
    let updated = 0;
    let persistenceStatus = dbHealth.status;

    if (dbHealth.connected) {
      try {
        const result = await upsertEarthquakes(usgsResult.data);
        inserted = result.inserted;
        updated = result.updated;
        dbPersisted = true;

        await recordIngestionRun({
          status: "SUCCESS",
          recordsReceived: usgsResult.totalReceived,
          recordsInserted: inserted,
          recordsUpdated: updated,
        });
      } catch (dbErr: any) {
        console.error("Database upsert failed during refresh:", dbErr.message);
        await recordIngestionRun({
          status: "FAILED",
          recordsReceived: usgsResult.totalReceived,
          recordsInserted: 0,
          recordsUpdated: 0,
          errorSummary: dbErr.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      recordsReceived: usgsResult.totalReceived,
      deduplicatedCount: usgsResult.data.length,
      databasePersistence: {
        status: persistenceStatus,
        recordsInserted: inserted,
        recordsUpdated: updated,
        persisted: dbPersisted,
        message: dbHealth.message,
      },
      refreshedAt: new Date(now).toISOString(),
    });
  } catch (error: any) {
    console.error("POST /api/ingestion/refresh error:", error.message);
    return NextResponse.json(
      { error: "Ingestion refresh failed", message: error.message },
      { status: 500 }
    );
  }
}
