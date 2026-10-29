import { NextRequest, NextResponse } from "next/server";
import { fetchUSGSEarthquakes } from "@/lib/usgs/client";
import {
  calculateMagnitudeAnomalies,
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

    // Format for time-series charts
    const chartSeries = observations.map((obs) => {
      const upperThreshold =
        obs.baselineMean !== null && obs.baselineStdDev !== null
          ? Math.round((obs.baselineMean + config.threshold * obs.baselineStdDev) * 100) / 100
          : null;
      const lowerThreshold =
        obs.baselineMean !== null && obs.baselineStdDev !== null
          ? Math.round(Math.max(0, obs.baselineMean - config.threshold * obs.baselineStdDev) * 100) / 100
          : null;

      return {
        eventId: obs.eventId,
        time: obs.eventTime,
        dateLabel: obs.eventTime.substring(5, 16).replace("T", " "),
        magnitude: obs.magnitude,
        baselineMean: obs.baselineMean,
        upperThreshold,
        lowerThreshold,
        zScore: obs.zScore,
        isAnomaly: obs.isAnomaly,
        place: obs.place,
        depthKm: obs.depthKm,
      };
    });

    return NextResponse.json({
      config,
      total: chartSeries.length,
      series: chartSeries,
      freshness: res.fetchedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate analytics timeseries", message: error.message },
      { status: 500 }
    );
  }
}
