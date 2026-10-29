import { Earthquake } from "@/types/earthquake";
import { USGSGeoJSONFeature, USGSGeoJSONResponse } from "./types";

export const SEISMOWATCH_BBOX = {
  minLatitude: 6,
  maxLatitude: 38,
  minLongitude: 68,
  maxLongitude: 98,
} as const;

export interface FetchOptions {
  startTime?: string; // ISO 8601 or YYYY-MM-DD
  endTime?: string;
  minMagnitude?: number;
  maxMagnitude?: number;
  limit?: number;
  forceRefresh?: boolean;
}

// In-memory response cache with TTL to avoid rate-limiting upstream
interface CacheEntry {
  timestamp: number;
  data: Earthquake[];
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Validates and converts a raw USGS GeoJSON Feature into a sanitized SeismoWatch Earthquake record.
 */
export function parseUSGSFeature(feature: USGSGeoJSONFeature): Earthquake | null {
  if (!feature || !feature.id || !feature.properties) {
    return null;
  }

  const { properties, geometry } = feature;
  const eventId = String(feature.id).trim();

  // Validate coordinates: GeoJSON Point coordinates are [longitude, latitude, depth]
  let longitude: number | null = null;
  let latitude: number | null = null;
  let depthKm: number | null = null;

  if (
    geometry &&
    geometry.type === "Point" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length >= 2
  ) {
    const rawLon = Number(geometry.coordinates[0]);
    const rawLat = Number(geometry.coordinates[1]);
    const rawDepth = geometry.coordinates.length > 2 ? Number(geometry.coordinates[2]) : null;

    if (!isNaN(rawLon) && rawLon >= -180 && rawLon <= 180) {
      longitude = rawLon;
    }
    if (!isNaN(rawLat) && rawLat >= -90 && rawLat <= 90) {
      latitude = rawLat;
    }
    if (rawDepth !== null && !isNaN(rawDepth)) {
      depthKm = Math.round(rawDepth * 100) / 100;
    }
  }

  // Validate timestamp
  const rawTime = properties.time;
  if (typeof rawTime !== "number" || isNaN(rawTime) || rawTime <= 0) {
    return null;
  }
  const eventTimeDate = new Date(rawTime);
  if (isNaN(eventTimeDate.getTime())) {
    return null;
  }

  // Magnitude handling (can be null or negative in some micro-tremor scales, but usually >= 0)
  const magnitude =
    properties.mag !== null && properties.mag !== undefined && !isNaN(properties.mag)
      ? Math.round(properties.mag * 10) / 10
      : null;

  return {
    eventId,
    magnitude,
    magnitudeType: properties.magType || null,
    place: properties.place ? properties.place.trim() : "Unspecified Himalayan/Indian Region",
    eventTime: eventTimeDate.toISOString(),
    eventTimeMs: rawTime,
    depthKm,
    latitude,
    longitude,
    sourceUrl: properties.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${eventId}`,
    sourceUpdatedAt: properties.updated ? new Date(properties.updated).toISOString() : null,
    significance: properties.sig ?? null,
    tsunami: properties.tsunami ?? null,
  };
}

/**
 * Deduplicate a collection of earthquakes by eventId.
 * If duplicates exist, preserve the entry with the newer sourceUpdatedAt or eventTime.
 */
export function deduplicateEarthquakes(events: Earthquake[]): Earthquake[] {
  const map = new Map<string, Earthquake>();

  for (const event of events) {
    const existing = map.get(event.eventId);
    if (!existing) {
      map.set(event.eventId, event);
    } else {
      const existingUpdate = existing.sourceUpdatedAt ? new Date(existing.sourceUpdatedAt).getTime() : 0;
      const currentUpdate = event.sourceUpdatedAt ? new Date(event.sourceUpdatedAt).getTime() : 0;
      if (currentUpdate >= existingUpdate) {
        map.set(event.eventId, event);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.eventTimeMs - a.eventTimeMs);
}

/**
 * Fetch earthquake observations from the USGS Earthquake Catalog API.
 */
export async function fetchUSGSEarthquakes(options: FetchOptions = {}): Promise<{
  data: Earthquake[];
  fromCache: boolean;
  fetchedAt: string;
  totalReceived: number;
}> {
  const now = Date.now();

  // Check cache if not forcing refresh
  if (!options.forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    let filtered = [...memoryCache.data];
    if (options.minMagnitude !== undefined) {
      filtered = filtered.filter((e) => e.magnitude !== null && e.magnitude >= options.minMagnitude!);
    }
    return {
      data: filtered,
      fromCache: true,
      fetchedAt: new Date(memoryCache.timestamp).toISOString(),
      totalReceived: memoryCache.data.length,
    };
  }

  const baseUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query";
  const params = new URLSearchParams({
    format: "geojson",
    minlatitude: String(SEISMOWATCH_BBOX.minLatitude),
    maxlatitude: String(SEISMOWATCH_BBOX.maxLatitude),
    minlongitude: String(SEISMOWATCH_BBOX.minLongitude),
    maxlongitude: String(SEISMOWATCH_BBOX.maxLongitude),
    orderby: "time",
    limit: String(options.limit || 250),
  });

  if (options.minMagnitude !== undefined) {
    params.set("minmagnitude", String(options.minMagnitude));
  } else {
    params.set("minmagnitude", "2.0"); // Focus on measurable regional events
  }

  if (options.maxMagnitude !== undefined) {
    params.set("maxmagnitude", String(options.maxMagnitude));
  }

  if (options.startTime) {
    params.set("starttime", options.startTime);
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    params.set("starttime", thirtyDaysAgo);
  }

  if (options.endTime) {
    params.set("endtime", options.endTime);
  }

  const url = `${baseUrl}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SeismoWatch/1.0 (Geospatial Seismic Research)",
      },
      next: { revalidate: 180 }, // Next.js cache tag
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`USGS API responded with HTTP status ${response.status}: ${response.statusText}`);
    }

    const payload: USGSGeoJSONResponse = await response.json();

    if (!payload || !Array.isArray(payload.features)) {
      throw new Error("Invalid GeoJSON payload received from USGS API");
    }

    const parsedEvents: Earthquake[] = [];
    for (const feature of payload.features) {
      const parsed = parseUSGSFeature(feature);
      if (parsed) {
        parsedEvents.push(parsed);
      }
    }

    const deduplicated = deduplicateEarthquakes(parsedEvents);

    // Update memory cache
    memoryCache = {
      timestamp: now,
      data: deduplicated,
    };

    return {
      data: deduplicated,
      fromCache: false,
      fetchedAt: new Date(now).toISOString(),
      totalReceived: payload.features.length,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    // If upstream fetch failed but we have stale cache, return stale cache with note
    if (memoryCache && memoryCache.data.length > 0) {
      console.warn("USGS API fetch failed; serving stale cache:", error.message);
      return {
        data: memoryCache.data,
        fromCache: true,
        fetchedAt: new Date(memoryCache.timestamp).toISOString(),
        totalReceived: memoryCache.data.length,
      };
    }

    throw new Error(`Failed to fetch USGS earthquake catalog: ${error.message}`);
  }
}

/**
 * Fetch a single earthquake observation by its USGS event ID.
 */
export async function fetchUSGSEventById(eventId: string): Promise<Earthquake | null> {
  const sanitizedId = eventId.replace(/[^a-zA-Z0-9_-]/g, "");
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=${sanitizedId}&format=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SeismoWatch/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`USGS event query failed with status ${response.status}`);
    }

    const feature: USGSGeoJSONFeature = await response.json();
    return parseUSGSFeature(feature);
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`Error querying USGS event ${eventId}:`, error.message);
    return null;
  }
}
