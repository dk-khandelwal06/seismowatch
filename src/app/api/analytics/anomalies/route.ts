import { NextRequest, NextResponse } from "next/server";
import { fetchUSGSEarthquakes } from "@/lib/usgs/client";
import {
  calculateMagnitudeAnomalies,
  calculateFrequencyAnomalies,
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
    const res = await fetchUSGSEarthquakes({ limit: 250 });
    const observations = calculateMagnitudeAnomalies(res.data, config);
    const frequencyBuckets = calculateFrequencyAnomalies(res.data, 24, config.threshold);

    const magnitudeAnomalies = observations.filter((o) => o.isAnomaly);
    const frequencyAnomalies = frequencyBuckets.filter((b) => b.isAnomaly);

    return NextResponse.json({
      config,
      totalAnalyzed: observations.length,
      magnitudeAnomaliesCount: magnitudeAnomalies.length,
      magnitudeAnomalies,
      frequencyAnomaliesCount: frequencyAnomalies.length,
      frequencyAnomalies,
      disclaimer:
        "SCIENTIFIC NOTICE: SeismoWatch does not predict earthquakes or guarantee advance warning. Statistical anomalies are exploratory mathematical signals only.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve anomalies", message: error.message },
      { status: 500 }
    );
  }
}
