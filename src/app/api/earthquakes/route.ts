import { NextRequest, NextResponse } from "next/server";
import { fetchUSGSEarthquakes } from "@/lib/usgs/client";
import { checkDatabaseHealth, getStoredEarthquakes } from "@/lib/database";
import { Earthquake, EarthquakeFilterParams } from "@/types/earthquake";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const search = searchParams.get("search") || undefined;
  const minMagStr = searchParams.get("minMagnitude");
  const maxMagStr = searchParams.get("maxMagnitude");
  const minDepthStr = searchParams.get("minDepth");
  const maxDepthStr = searchParams.get("maxDepth");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const sortBy = (searchParams.get("sortBy") as EarthquakeFilterParams["sortBy"]) || "eventTime";
  const sortOrder = (searchParams.get("sortOrder") as EarthquakeFilterParams["sortOrder"]) || "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  const minMagnitude = minMagStr !== null ? parseFloat(minMagStr) : 2.0;
  const maxMagnitude = maxMagStr !== null ? parseFloat(maxMagStr) : undefined;
  const minDepth = minDepthStr !== null ? parseFloat(minDepthStr) : undefined;
  const maxDepth = maxDepthStr !== null ? parseFloat(maxDepthStr) : undefined;

  const filterParams: EarthquakeFilterParams = {
    search,
    minMagnitude,
    maxMagnitude,
    minDepth,
    maxDepth,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    page,
    limit,
  };

  try {
    // Check if database persistence is operational
    const dbHealth = await checkDatabaseHealth();

    if (dbHealth.connected && (dbHealth.totalRecords ?? 0) > 0) {
      const stored = await getStoredEarthquakes(filterParams);
      return NextResponse.json({
        data: stored.data,
        total: stored.total,
        page,
        limit,
        totalPages: Math.ceil(stored.total / limit) || 1,
        filterApplied: filterParams,
        lastFetchedAt: new Date().toISOString(),
        source: "DATABASE",
      });
    }

    // Fallback: Fetch directly from USGS Earthquake API
    const usgsResult = await fetchUSGSEarthquakes({
      minMagnitude: minMagnitude,
      maxMagnitude: maxMagnitude,
      startTime: startDate,
      endTime: endDate,
      limit: 250,
    });

    let records = [...usgsResult.data];

    // Apply client-side filters on fetched records
    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (e) => (e.place && e.place.toLowerCase().includes(q)) || e.eventId.toLowerCase().includes(q)
      );
    }
    if (minDepth !== undefined) {
      records = records.filter((e) => e.depthKm !== null && e.depthKm >= minDepth);
    }
    if (maxDepth !== undefined) {
      records = records.filter((e) => e.depthKm !== null && e.depthKm <= maxDepth);
    }

    // Sort records
    records.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === "magnitude") {
        valA = a.magnitude ?? -999;
        valB = b.magnitude ?? -999;
      } else if (sortBy === "depthKm") {
        valA = a.depthKm ?? -999;
        valB = b.depthKm ?? -999;
      } else {
        valA = a.eventTimeMs;
        valB = b.eventTimeMs;
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    const total = records.length;
    const startIndex = (page - 1) * limit;
    const paginated = records.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      filterApplied: filterParams,
      lastFetchedAt: usgsResult.fetchedAt,
      source: usgsResult.fromCache ? "LIVE_CACHE" : "UPSTREAM_USGS",
    });
  } catch (error: any) {
    console.error("GET /api/earthquakes error:", error.message);
    return NextResponse.json(
      {
        error: "Failed to retrieve earthquake observations",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
