import { describe, it, expect } from "vitest";
import {
  calculateMagnitudeAnomalies,
  calculateFrequencyAnomalies,
  buildAnalyticsSummary,
  DEFAULT_ANALYTICS_CONFIG,
} from "@/lib/analytics/engine";
import { Earthquake } from "@/types/earthquake";

describe("Statistical Anomaly Engine (Rolling Window & Z-Scores)", () => {
  const baseTime = 1700000000000;

  function createMockEvent(id: string, mag: number | null, timeOffsetHours: number): Earthquake {
    const timeMs = baseTime + timeOffsetHours * 3600 * 1000;
    return {
      eventId: id,
      magnitude: mag,
      magnitudeType: "mb",
      place: "Himalayan Ridge, Nepal",
      eventTime: new Date(timeMs).toISOString(),
      eventTimeMs: timeMs,
      depthKm: 15.0,
      latitude: 28.0,
      longitude: 85.0,
      sourceUrl: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
      sourceUpdatedAt: new Date(timeMs + 60000).toISOString(),
    };
  }

  it("handles insufficient baseline observations gracefully without producing anomalies or NaN", () => {
    // 5 observations when minBaseline is 10
    const events: Earthquake[] = [];
    for (let i = 0; i < 5; i++) {
      events.push(createMockEvent(`evt-${i}`, 3.5, i));
    }

    const results = calculateMagnitudeAnomalies(events, { minBaseline: 10 });
    expect(results.length).toBe(5);

    for (const r of results) {
      expect(r.status).toBe("INSUFFICIENT_BASELINE");
      expect(r.zScore).toBeNull();
      expect(r.isAnomaly).toBe(false);
      expect(r.baselineMean).toBeNull();
      expect(r.explanation).toContain("Insufficient historical baseline");
    }
  });

  it("strictly excludes current observation from its own baseline (prospective baseline rule)", () => {
    // 10 events of M3.0, followed by 1 event of M6.0
    const events: Earthquake[] = [];
    for (let i = 0; i < 10; i++) {
      // Add slight variance to avoid zero std dev: alternating 2.9, 3.1
      events.push(createMockEvent(`base-${i}`, i % 2 === 0 ? 3.1 : 2.9, i));
    }
    // 11th event has magnitude 6.0
    events.push(createMockEvent("spike-11", 6.0, 10));

    const results = calculateMagnitudeAnomalies(events, { windowSize: 10, minBaseline: 5, threshold: 2.0 });

    const spikeResult = results[10];
    expect(spikeResult.eventId).toBe("spike-11");
    expect(spikeResult.status).toBe("ANOMALY");
    expect(spikeResult.isAnomaly).toBe(true);

    // Baseline mean should be approximately 3.0 (calculated strictly from prior 10 events, NOT including 6.0)
    expect(spikeResult.baselineMean).toBeCloseTo(3.0, 1);
    expect(spikeResult.zScore).toBeGreaterThan(5.0); // Z-score should be high
  });

  it("safely handles zero standard deviation without NaN or Infinity", () => {
    // 12 events with IDENTICAL magnitude 4.0
    const events: Earthquake[] = [];
    for (let i = 0; i < 12; i++) {
      events.push(createMockEvent(`same-${i}`, 4.0, i));
    }

    const results = calculateMagnitudeAnomalies(events, { windowSize: 10, minBaseline: 5, threshold: 2.0 });
    expect(results.length).toBe(12);

    // Event 11 has 10 identical prior events -> stdDev = 0
    const lastResult = results[11];
    expect(lastResult.baselineStdDev).toBe(0);
    expect(lastResult.zScore).toBe(0);
    expect(isNaN(lastResult.zScore!)).toBe(false);
    expect(isFinite(lastResult.zScore!)).toBe(true);
    expect(lastResult.isAnomaly).toBe(false);
  });

  it("filters out null and invalid magnitudes cleanly", () => {
    const events: Earthquake[] = [
      createMockEvent("evt-1", 3.0, 1),
      createMockEvent("evt-null", null, 2),
      createMockEvent("evt-3", 3.2, 3),
      createMockEvent("evt-nan", NaN, 4),
      createMockEvent("evt-5", 3.1, 5),
    ];

    const results = calculateMagnitudeAnomalies(events, { minBaseline: 2 });
    // Only 3 valid events should be processed
    expect(results.length).toBe(3);
    expect(results.find((r) => r.eventId === "evt-null")).toBeUndefined();
    expect(results.find((r) => r.eventId === "evt-nan")).toBeUndefined();
  });

  it("respects threshold boundaries accurately", () => {
    // Generate 15 baseline events with mean 3.0, std dev approx 0.2
    const events: Earthquake[] = [];
    for (let i = 0; i < 15; i++) {
      events.push(createMockEvent(`base-${i}`, 3.0 + ((i % 5) - 2) * 0.1, i));
    }
    // Event with z just below threshold
    events.push(createMockEvent("sub-threshold", 3.25, 15));
    // Event with z well above threshold
    events.push(createMockEvent("super-threshold", 4.5, 16));

    const results = calculateMagnitudeAnomalies(events, { windowSize: 15, minBaseline: 10, threshold: 2.0 });

    const sub = results.find((r) => r.eventId === "sub-threshold")!;
    const superT = results.find((r) => r.eventId === "super-threshold")!;

    expect(sub.isAnomaly).toBe(false);
    expect(sub.status).toBe("NORMAL");

    expect(superT.isAnomaly).toBe(true);
    expect(superT.status).toBe("ANOMALY");
    expect(superT.zScore).toBeGreaterThan(2.0);
  });

  it("calculates frequency anomalies across 24h intervals independently of magnitude", () => {
    // Generate 10 events over 5 days (2 per day), then 15 events on day 6 (clustered swarm)
    const events: Earthquake[] = [];
    let idCounter = 1;

    for (let day = 0; day < 5; day++) {
      events.push(createMockEvent(`day-${day}-1`, 2.5, day * 24 + 2));
      events.push(createMockEvent(`day-${day}-2`, 2.6, day * 24 + 14));
    }

    // Day 5 has 15 events (clustered)
    for (let k = 0; k < 15; k++) {
      events.push(createMockEvent(`swarm-${k}`, 2.5, 5 * 24 + 1 + (k % 10) * 0.1));
    }

    const freqBuckets = calculateFrequencyAnomalies(events, 24, 2.0);
    expect(freqBuckets.length).toBeGreaterThanOrEqual(5);

    const swarmBucket = freqBuckets.find((b) => b.count === 15);
    expect(swarmBucket).toBeDefined();
    expect(swarmBucket!.isAnomaly).toBe(true);
    expect(swarmBucket!.zScore).toBeGreaterThan(2.0);
    expect(swarmBucket!.explanation).toContain("Statistically unusual frequency");
  });

  it("builds comprehensive summary metrics", () => {
    const events: Earthquake[] = [];
    for (let i = 0; i < 20; i++) {
      events.push(createMockEvent(`evt-${i}`, 3.0 + (i === 18 ? 3.0 : 0.1), i));
    }

    const observations = calculateMagnitudeAnomalies(events, { minBaseline: 5, threshold: 2.0 });
    const frequency = calculateFrequencyAnomalies(events, 24, 2.0);
    const summary = buildAnalyticsSummary(observations, frequency, DEFAULT_ANALYTICS_CONFIG);

    expect(summary.totalAnalyzed).toBe(20);
    expect(summary.highestMagnitude?.magnitude).toBe(6.0);
    expect(summary.meanMagnitude).toBeGreaterThan(3.0);
    expect(summary.generatedAt).toBeDefined();
  });
});
