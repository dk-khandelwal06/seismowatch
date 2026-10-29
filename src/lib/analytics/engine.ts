import { Earthquake } from "@/types/earthquake";
import {
  AnalyticsConfig,
  AnalyticsSummary,
  FrequencyBucket,
  StatisticalObservation,
} from "@/types/analytics";

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  windowSize: 30,
  threshold: 2.0,
  minBaseline: 10,
};

/**
 * Calculates prospective rolling window statistics and z-scores for a series of earthquakes.
 * STRICT SCIENTIFIC RULE:
 * The baseline for observation i uses only PRIOR observations [i - windowSize ... i - 1].
 * The current observation is strictly excluded from its own baseline.
 */
export function calculateMagnitudeAnomalies(
  earthquakes: Earthquake[],
  customConfig: Partial<AnalyticsConfig> = {}
): StatisticalObservation[] {
  const config: AnalyticsConfig = {
    windowSize: Math.max(5, customConfig.windowSize ?? DEFAULT_ANALYTICS_CONFIG.windowSize),
    threshold: Math.max(1.0, customConfig.threshold ?? DEFAULT_ANALYTICS_CONFIG.threshold),
    minBaseline: Math.max(3, customConfig.minBaseline ?? DEFAULT_ANALYTICS_CONFIG.minBaseline),
  };

  // Filter out events with null or invalid magnitude, and sort strictly chronologically (ascending time)
  const validEvents = earthquakes
    .filter((e): e is Earthquake & { magnitude: number } => e.magnitude !== null && !isNaN(e.magnitude))
    .sort((a, b) => a.eventTimeMs - b.eventTimeMs);

  const results: StatisticalObservation[] = [];

  for (let i = 0; i < validEvents.length; i++) {
    const current = validEvents[i];
    const mag = current.magnitude;

    // Prospective baseline slice: strictly prior observations up to windowSize
    const startIndex = Math.max(0, i - config.windowSize);
    const baselineSlice = validEvents.slice(startIndex, i);
    const baselineSize = baselineSlice.length;

    if (baselineSize < config.minBaseline) {
      results.push({
        eventId: current.eventId,
        magnitude: mag,
        eventTime: current.eventTime,
        depthKm: current.depthKm,
        place: current.place,
        latitude: current.latitude,
        longitude: current.longitude,
        baselineMean: null,
        baselineStdDev: null,
        baselineSize,
        zScore: null,
        isAnomaly: false,
        status: "INSUFFICIENT_BASELINE",
        explanation: `Insufficient historical baseline (${baselineSize}/${config.minBaseline} prior events required). Statistical anomaly status cannot be established.`,
      });
      continue;
    }

    // Calculate rolling mean
    let sum = 0;
    for (let k = 0; k < baselineSize; k++) {
      sum += baselineSlice[k].magnitude;
    }
    const rollingMean = sum / baselineSize;

    // Calculate sample standard deviation (N-1)
    let varianceSum = 0;
    for (let k = 0; k < baselineSize; k++) {
      const diff = baselineSlice[k].magnitude - rollingMean;
      varianceSum += diff * diff;
    }
    const sampleStdDev = Math.sqrt(varianceSum / (baselineSize - 1));

    // Handle zero standard deviation safely (e.g. all baseline events had identical magnitude)
    let zScore: number;
    let isAnomaly = false;

    if (sampleStdDev < 0.0001) {
      zScore = 0;
      isAnomaly = false;
    } else {
      const rawZ = (mag - rollingMean) / sampleStdDev;
      zScore = Math.round(rawZ * 100) / 100;
      isAnomaly = Math.abs(zScore) >= config.threshold;
    }

    // Safety checks against NaN or Infinity
    if (isNaN(zScore) || !isFinite(zScore)) {
      zScore = 0;
      isAnomaly = false;
    }

    const roundedMean = Math.round(rollingMean * 100) / 100;
    const roundedStd = Math.round(sampleStdDev * 100) / 100;

    let explanation: string;
    if (isAnomaly) {
      const direction = zScore > 0 ? "higher" : "lower";
      explanation = `Statistically unusual magnitude: z-score = ${zScore > 0 ? "+" : ""}${zScore}. Observed M${mag} is ${Math.abs(
        Math.round((mag - rollingMean) * 100) / 100
      )} units ${direction} than the prior ${baselineSize}-event rolling mean (M${roundedMean} ± ${roundedStd}).`;
    } else {
      explanation = `Observed M${mag} is within expected variation (z-score = ${
        zScore > 0 ? "+" : ""
      }${zScore}) relative to prior ${baselineSize}-event baseline (M${roundedMean} ± ${roundedStd}).`;
    }

    results.push({
      eventId: current.eventId,
      magnitude: mag,
      eventTime: current.eventTime,
      depthKm: current.depthKm,
      place: current.place,
      latitude: current.latitude,
      longitude: current.longitude,
      baselineMean: roundedMean,
      baselineStdDev: roundedStd,
      baselineSize,
      zScore,
      isAnomaly,
      status: isAnomaly ? "ANOMALY" : "NORMAL",
      explanation,
    });
  }

  return results;
}

/**
 * Calculates earthquake frequency analysis across 24-hour time intervals.
 * Distinguishes frequency clustering from individual magnitude outliers.
 */
export function calculateFrequencyAnomalies(
  earthquakes: Earthquake[],
  intervalHours: number = 24,
  thresholdZ: number = 2.0
): FrequencyBucket[] {
  if (earthquakes.length === 0) return [];

  // Sort ascending by time
  const sorted = [...earthquakes].sort((a, b) => a.eventTimeMs - b.eventTimeMs);

  const bucketMap = new Map<string, { count: number; startMs: number; endMs: number }>();

  // Populate daily counts using UTC calendar date
  for (const event of sorted) {
    const dayKey = event.eventTime.split("T")[0];
    const existing = bucketMap.get(dayKey);
    if (!existing) {
      const dayStart = new Date(`${dayKey}T00:00:00.000Z`).getTime();
      bucketMap.set(dayKey, {
        count: 1,
        startMs: dayStart,
        endMs: dayStart + intervalHours * 3600 * 1000,
      });
    } else {
      existing.count++;
    }
  }

  const buckets = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, data]) => ({
      dateKey,
      ...data,
    }));

  const counts = buckets.map((b) => b.count);
  const totalBuckets = counts.length;
  const meanCount = totalBuckets > 0 ? counts.reduce((a, b) => a + b, 0) / totalBuckets : 0;

  const variance =
    totalBuckets > 1
      ? counts.reduce((acc, c) => acc + Math.pow(c - meanCount, 2), 0) / (totalBuckets - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  const results: FrequencyBucket[] = [];

  for (const b of buckets) {
    let z = 0;
    if (stdDev > 0.0001) {
      z = Math.round(((b.count - meanCount) / stdDev) * 100) / 100;
    }
    if (isNaN(z) || !isFinite(z)) z = 0;

    const isAnomaly = z >= thresholdZ;

    const explanation = isAnomaly
      ? `Statistically unusual frequency: ${b.count} events recorded on ${b.dateKey} (z-score = +${z}), significantly above regional daily average of ${Math.round(meanCount * 10) / 10} events.`
      : `${b.count} events on ${b.dateKey} (z-score = ${z >= 0 ? "+" : ""}${z}), consistent with regional daily baseline.`;

    results.push({
      periodKey: b.dateKey,
      periodStart: new Date(b.startMs).toISOString(),
      periodEnd: new Date(b.endMs).toISOString(),
      count: b.count,
      expectedMean: Math.round(meanCount * 10) / 10,
      expectedStdDev: Math.round(stdDev * 10) / 10,
      zScore: z,
      isAnomaly,
      explanation,
    });
  }

  return results;
}

/**
 * Builds high-level scientific summary of analytics findings.
 */
export function buildAnalyticsSummary(
  observations: StatisticalObservation[],
  frequencyBuckets: FrequencyBucket[],
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): AnalyticsSummary {
  const totalAnalyzed = observations.length;
  const anomalies = observations.filter((o) => o.isAnomaly);
  const insufficient = observations.filter((o) => o.status === "INSUFFICIENT_BASELINE");
  const normal = observations.filter((o) => o.status === "NORMAL");

  let highestMagObj: AnalyticsSummary["highestMagnitude"] = null;
  let highestZObj: AnalyticsSummary["highestZScore"] = null;

  let magSum = 0;
  for (const obs of observations) {
    magSum += obs.magnitude;

    if (!highestMagObj || obs.magnitude > highestMagObj.magnitude) {
      highestMagObj = {
        eventId: obs.eventId,
        magnitude: obs.magnitude,
        place: obs.place,
        eventTime: obs.eventTime,
        zScore: obs.zScore,
      };
    }

    if (obs.zScore !== null) {
      if (!highestZObj || obs.zScore > highestZObj.zScore) {
        highestZObj = {
          eventId: obs.eventId,
          magnitude: obs.magnitude,
          place: obs.place,
          eventTime: obs.eventTime,
          zScore: obs.zScore,
        };
      }
    }
  }

  const meanMag = totalAnalyzed > 0 ? Math.round((magSum / totalAnalyzed) * 100) / 100 : 0;
  let varianceSum = 0;
  for (const obs of observations) {
    varianceSum += Math.pow(obs.magnitude - meanMag, 2);
  }
  const stdDevMag =
    totalAnalyzed > 1 ? Math.round(Math.sqrt(varianceSum / (totalAnalyzed - 1)) * 100) / 100 : 0;

  const freqAnomalies = frequencyBuckets.filter((b) => b.isAnomaly);
  let peakFreq: AnalyticsSummary["frequencySummary"]["peakInterval"] = null;
  for (const b of frequencyBuckets) {
    if (!peakFreq || b.count > peakFreq.count) {
      peakFreq = {
        periodKey: b.periodKey,
        count: b.count,
        zScore: b.zScore,
      };
    }
  }

  return {
    config,
    totalAnalyzed,
    anomaliesDetected: anomalies.length,
    insufficientBaselineCount: insufficient.length,
    normalCount: normal.length,
    highestMagnitude: highestMagObj,
    highestZScore: highestZObj,
    meanMagnitude: meanMag,
    stdDevMagnitude: stdDevMag,
    frequencySummary: {
      totalBuckets: frequencyBuckets.length,
      frequencyAnomalies: freqAnomalies.length,
      peakInterval: peakFreq,
    },
    generatedAt: new Date().toISOString(),
  };
}
