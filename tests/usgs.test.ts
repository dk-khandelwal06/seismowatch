import { describe, it, expect } from "vitest";
import { parseUSGSFeature, deduplicateEarthquakes } from "@/lib/usgs/client";
import { USGSGeoJSONFeature } from "@/lib/usgs/types";
import { Earthquake } from "@/types/earthquake";

describe("USGS GeoJSON Parser & Deduplication", () => {
  it("parses valid USGS GeoJSON feature into normalized Earthquake record", () => {
    const rawFeature: USGSGeoJSONFeature = {
      id: "us7000abcd",
      type: "Feature",
      properties: {
        mag: 5.42,
        place: "78 km NE of Kathmandu, Nepal",
        time: 1729000000000,
        updated: 1729000600000,
        tz: null,
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
        detail: null,
        felt: 42,
        cdi: 4.5,
        mmi: 5.2,
        alert: "green",
        status: "reviewed",
        tsunami: 0,
        sig: 450,
        net: "us",
        code: "7000abcd",
        ids: ",us7000abcd,",
        sources: ",us,",
        types: ",moment-tensor,origin,",
        nst: 84,
        dmin: 1.2,
        rms: 0.65,
        gap: 45,
        magType: "mww",
        type: "earthquake",
        title: "M 5.4 - 78 km NE of Kathmandu, Nepal",
      },
      geometry: {
        type: "Point",
        coordinates: [85.854, 28.125, 12.4], // [lon, lat, depth]
      },
    };

    const parsed = parseUSGSFeature(rawFeature);
    expect(parsed).not.toBeNull();
    expect(parsed!.eventId).toBe("us7000abcd");
    expect(parsed!.magnitude).toBe(5.4);
    expect(parsed!.magnitudeType).toBe("mww");
    expect(parsed!.longitude).toBe(85.854);
    expect(parsed!.latitude).toBe(28.125);
    expect(parsed!.depthKm).toBe(12.4);
    expect(parsed!.place).toBe("78 km NE of Kathmandu, Nepal");
    expect(parsed!.eventTime).toBe(new Date(1729000000000).toISOString());
    expect(parsed!.eventTimeMs).toBe(1729000000000);
    expect(parsed!.significance).toBe(450);
  });

  it("handles missing or null coordinates safely", () => {
    const rawFeature: any = {
      id: "us7000missingcoords",
      type: "Feature",
      properties: {
        mag: 3.2,
        place: "Hindu Kush Region, Afghanistan",
        time: 1729000000000,
      },
      geometry: null,
    };

    const parsed = parseUSGSFeature(rawFeature);
    expect(parsed).not.toBeNull();
    expect(parsed!.latitude).toBeNull();
    expect(parsed!.longitude).toBeNull();
    expect(parsed!.depthKm).toBeNull();
  });

  it("rejects features with invalid timestamps or missing ID", () => {
    const noIdFeature: any = {
      type: "Feature",
      properties: { mag: 4.0, time: 1729000000000 },
    };
    expect(parseUSGSFeature(noIdFeature)).toBeNull();

    const invalidTimeFeature: any = {
      id: "bad-time",
      type: "Feature",
      properties: { mag: 4.0, time: "not-a-number" },
    };
    expect(parseUSGSFeature(invalidTimeFeature)).toBeNull();
  });

  it("deduplicates identical events and keeps latest update", () => {
    const oldVersion: Earthquake = {
      eventId: "us2026dup1",
      magnitude: 4.8,
      magnitudeType: "mb",
      place: "Northern Xinjiang, China",
      eventTime: new Date(1729000000000).toISOString(),
      eventTimeMs: 1729000000000,
      depthKm: 10,
      latitude: 36.5,
      longitude: 80.2,
      sourceUrl: "https://earthquake.usgs.gov/earthquakes/eventpage/us2026dup1",
      sourceUpdatedAt: new Date(1729000100000).toISOString(),
    };

    const updatedVersion: Earthquake = {
      ...oldVersion,
      magnitude: 5.0, // reviewed magnitude
      magnitudeType: "mww",
      sourceUpdatedAt: new Date(1729000500000).toISOString(), // newer update
    };

    const otherEvent: Earthquake = {
      eventId: "us2026other",
      magnitude: 3.2,
      magnitudeType: "ml",
      place: "Assam, India",
      eventTime: new Date(1729000200000).toISOString(),
      eventTimeMs: 1729000200000,
      depthKm: 25,
      latitude: 26.2,
      longitude: 92.5,
      sourceUrl: "https://earthquake.usgs.gov/earthquakes/eventpage/us2026other",
      sourceUpdatedAt: null,
    };

    const deduplicated = deduplicateEarthquakes([oldVersion, otherEvent, updatedVersion]);

    expect(deduplicated.length).toBe(2);
    const resolved = deduplicated.find((e) => e.eventId === "us2026dup1");
    expect(resolved).toBeDefined();
    expect(resolved!.magnitude).toBe(5.0);
    expect(resolved!.magnitudeType).toBe("mww");
  });
});
