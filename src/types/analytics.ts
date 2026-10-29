export interface AnalyticsConfig {
  windowSize: number; // e.g. 30 prior observations
  threshold: number;  // default 2.0 (|z| >= 2.0)
  minBaseline: number;// e.g. 10 prior observations
}

export interface StatisticalObservation {
  eventId: string;
  magnitude: number;
  eventTime: string;
  depthKm: number | null;
  place: string | null;
  latitude: number | null;
  longitude: number | null;
  baselineMean: number | null;
  baselineStdDev: number | null;
  baselineSize: number;
  zScore: number | null;
  isAnomaly: boolean;
  status: "NORMAL" | "ANOMALY" | "INSUFFICIENT_BASELINE";
  explanation: string;
}

export interface FrequencyBucket {
  periodKey: string;      // e.g. "2026-10-28" or ISO interval
  periodStart: string;
  periodEnd: string;
  count: number;
  expectedMean: number;
  expectedStdDev: number;
  zScore: number;
  isAnomaly: boolean;
  explanation: string;
}

export interface AnalyticsSummary {
  config: AnalyticsConfig;
  totalAnalyzed: number;
  anomaliesDetected: number;
  insufficientBaselineCount: number;
  normalCount: number;
  highestMagnitude: {
    eventId: string;
    magnitude: number;
    place: string | null;
    eventTime: string;
    zScore: number | null;
  } | null;
  highestZScore: {
    eventId: string;
    magnitude: number;
    place: string | null;
    eventTime: string;
    zScore: number;
  } | null;
  meanMagnitude: number;
  stdDevMagnitude: number;
  frequencySummary: {
    totalBuckets: number;
    frequencyAnomalies: number;
    peakInterval: {
      periodKey: string;
      count: number;
      zScore: number;
    } | null;
  };
  generatedAt: string;
}
