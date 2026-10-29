import { NextRequest, NextResponse } from "next/server";
import { fetchUSGSEarthquakes } from "@/lib/usgs/client";
import {
  calculateMagnitudeAnomalies,
  calculateFrequencyAnomalies,
  buildAnalyticsSummary,
  DEFAULT_ANALYTICS_CONFIG,
} from "@/lib/analytics/engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const windowSize = parseInt(
    searchParams.get("windowSize") || String(DEFAULT_ANALYTICS_CONFIG.windowSize),
    10
  );
  const threshold = parseFloat(
    searchParams.get("threshold") || String(DEFAULT_ANALYTICS_CONFIG.threshold)
  );
  const minBaseline = parseInt(
    searchParams.get("minBaseline") || String(DEFAULT_ANALYTICS_CONFIG.minBaseline),
    10
  );

  const config = {
    windowSize: isNaN(windowSize) ? DEFAULT_ANALYTICS_CONFIG.windowSize : windowSize,
    threshold: isNaN(threshold) ? DEFAULT_ANALYTICS_CONFIG.threshold : threshold,
    minBaseline: isNaN(minBaseline) ? DEFAULT_ANALYTICS_CONFIG.minBaseline : minBaseline,
  };

  try {
    const earthquakesRes = await fetchUSGSEarthquakes({ limit: 250 });
    const observations = calculateMagnitudeAnomalies(earthquakesRes.data, config);
    const frequencyBuckets = calculateFrequencyAnomalies(earthquakesRes.data, 24, config.threshold);

    const summary = buildAnalyticsSummary(observations, frequencyBuckets, config);

    return NextResponse.json({
      summary,
      datasetFreshness: earthquakesRes.fetchedAt,
      source: earthquakesRes.fromCache ? "LIVE_CACHE" : "UPSTREAM_USGS",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate analytics summary", message: error.message },
      { status: 500 }
    );
  }
}
