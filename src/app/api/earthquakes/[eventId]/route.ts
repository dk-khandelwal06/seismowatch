import { NextRequest, NextResponse } from "next/server";
import { fetchUSGSEventById, fetchUSGSEarthquakes } from "@/lib/usgs/client";
import { calculateMagnitudeAnomalies } from "@/lib/analytics/engine";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;

  if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
    return NextResponse.json({ error: "Invalid eventId parameter" }, { status: 400 });
  }

  try {
    const event = await fetchUSGSEventById(eventId);

    if (!event) {
      return NextResponse.json(
        {
          error: "Event not found",
          message: `Earthquake observation ${eventId} could not be resolved in the USGS catalog.`,
        },
        { status: 404 }
      );
    }

    // Contextual statistical analysis: compare this event with surrounding regional events
    let statisticalContext = null;
    try {
      const recentRegional = await fetchUSGSEarthquakes({ limit: 100 });
      // Ensure the event is in the array
      const combined = [...recentRegional.data.filter((e) => e.eventId !== event.eventId), event];
      const observations = calculateMagnitudeAnomalies(combined, {
        windowSize: 30,
        threshold: 2.0,
        minBaseline: 5,
      });
      const match = observations.find((o) => o.eventId === event.eventId);
      if (match) {
        statisticalContext = {
          baselineMean: match.baselineMean,
          baselineStdDev: match.baselineStdDev,
          baselineSize: match.baselineSize,
          zScore: match.zScore,
          isAnomaly: match.isAnomaly,
          status: match.status,
          explanation: match.explanation,
        };
      }
    } catch (analysisErr) {
      console.warn("Could not compute statistical context for event:", analysisErr);
    }

    return NextResponse.json({
      data: event,
      statisticalContext,
      disclaimer:
        "SCIENTIFIC NOTICE: SeismoWatch does not predict earthquakes. Statistical anomalies are exploratory signals only.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error querying event", message: err.message },
      { status: 500 }
    );
  }
}
