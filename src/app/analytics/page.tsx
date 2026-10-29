"use client";

import React, { useEffect, useState } from "react";
import { Earthquake } from "@/types/earthquake";
import {
  AnalyticsConfig,
  StatisticalObservation,
  FrequencyBucket,
  AnalyticsSummary,
} from "@/types/analytics";
import {
  calculateMagnitudeAnomalies,
  calculateFrequencyAnomalies,
  buildAnalyticsSummary,
  DEFAULT_ANALYTICS_CONFIG,
} from "@/lib/analytics/engine";
import { AnomalyLabControls } from "@/components/analytics/AnomalyLabControls";
import { BaselineComparisonChart } from "@/components/charts/BaselineComparisonChart";
import { ZScoreTimelineChart } from "@/components/charts/ZScoreTimelineChart";
import { FrequencyChart } from "@/components/charts/FrequencyChart";
import { FlaggedObservationsTable } from "@/components/analytics/FlaggedObservationsTable";
import { LiveIndicator } from "@/components/observatory/LiveIndicator";
import {
  BarChart3,
  Sliders,
  AlertTriangle,
  Activity,
  Compass,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function AnomalyLaboratoryPage() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [config, setConfig] = useState<AnalyticsConfig>(DEFAULT_ANALYTICS_CONFIG);
  const [observations, setObservations] = useState<StatisticalObservation[]>([]);
  const [frequencyBuckets, setFrequencyBuckets] = useState<FrequencyBucket[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>(new Date().toISOString());
  const [dataSource, setDataSource] = useState<string>("UPSTREAM_USGS");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch observations
  const loadData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      if (forceRefresh) {
        await fetch("/api/ingestion/refresh", { method: "POST" });
      }
      const res = await fetch("/api/earthquakes?limit=250");
      if (res.ok) {
        const payload = await res.json();
        const events: Earthquake[] = payload.data || [];
        setEarthquakes(events);
        setLastFetchedAt(payload.lastFetchedAt || new Date().toISOString());
        setDataSource(payload.source || "UPSTREAM_USGS");
      }
    } catch (err) {
      console.error("Error loading data for Anomaly Lab:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate statistical anomalies whenever earthquakes or config changes
  useEffect(() => {
    if (earthquakes.length === 0) return;

    const obs = calculateMagnitudeAnomalies(earthquakes, config);
    const freq = calculateFrequencyAnomalies(earthquakes, 24, config.threshold);
    const sum = buildAnalyticsSummary(obs, freq, config);

    setObservations(obs);
    setFrequencyBuckets(freq);
    setSummary(sum);
  }, [earthquakes, config]);

  const flaggedCount = observations.filter((o) => o.isAnomaly).length;
  const freqAnomaliesCount = frequencyBuckets.filter((b) => b.isAnomaly).length;

  // Chart data formatting
  const comparisonSeries = observations.map((o) => ({
    eventId: o.eventId,
    dateLabel: o.eventTime.substring(5, 16).replace("T", " "),
    magnitude: o.magnitude,
    baselineMean: o.baselineMean,
    upperThreshold:
      o.baselineMean !== null && o.baselineStdDev !== null
        ? Math.round((o.baselineMean + config.threshold * o.baselineStdDev) * 100) / 100
        : null,
    lowerThreshold:
      o.baselineMean !== null && o.baselineStdDev !== null
        ? Math.round(Math.max(0, o.baselineMean - config.threshold * o.baselineStdDev) * 100) / 100
        : null,
    isAnomaly: o.isAnomaly,
    zScore: o.zScore,
    place: o.place,
  }));

  const zScoreSeries = observations.map((o) => ({
    eventId: o.eventId,
    dateLabel: o.eventTime.substring(5, 16).replace("T", " "),
    zScore: o.zScore,
    magnitude: o.magnitude,
    place: o.place,
    isAnomaly: o.isAnomaly,
  }));

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-500 text-xs font-mono uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Statistical Analysis Engine • Rolling Prospective Z-Scores</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Anomaly Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Mathematical outlier detection using strictly prospective baselines. Adjust sliding
            windows and z-score thresholds to analyze deviations in magnitude and seismic clustering.
          </p>
        </div>
      </div>

      <LiveIndicator
        lastFetchedAt={lastFetchedAt}
        latestEventTime={earthquakes[0]?.eventTime}
        source={dataSource}
        onRefresh={() => loadData(true)}
      />

      {/* Critical Scientific Disclaimer */}
      <div className="flex items-start space-x-2.5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-300">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">CRITICAL SCIENTIFIC DISCLAIMER</p>
          <p className="text-[11px] leading-relaxed">
            SeismoWatch does not predict earthquakes, guarantee advance warning, or establish that an
            anomaly forecasts a future earthquake. Statistical anomalies are exploratory signals only.
            Earthquakes cannot be predicted with current scientific methods.
          </p>
        </div>
      </div>

      {/* Interactive Sliders & Parameter Controls */}
      <AnomalyLabControls
        config={config}
        onChange={setConfig}
        onReset={() => setConfig(DEFAULT_ANALYTICS_CONFIG)}
      />

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="observatory-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Analyzed Events</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {observations.length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Chronologically ordered</span>
        </div>

        <div className="observatory-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Magnitude Anomalies</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-amber-500">
              {flaggedCount}
            </span>
            <span className="text-[11px] font-mono text-slate-400">|z| ≥ {config.threshold}σ</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Prospective baseline outliers</span>
        </div>

        <div className="observatory-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Frequency Surges</span>
          <span className="text-2xl font-bold font-mono text-sky-500">
            {freqAnomaliesCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">24h clustering alerts</span>
        </div>

        <div className="observatory-card p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Highest Z-Score</span>
          <span className="text-2xl font-bold font-mono text-red-500">
            {summary?.highestZScore ? `+${summary.highestZScore.zScore}σ` : "—"}
          </span>
          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
            {summary?.highestZScore?.place || "None"}
          </span>
        </div>
      </div>

      {/* Chart 1: Prospective Baseline vs Observed Magnitude */}
      <div className="observatory-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Prospective Rolling Baseline Envelope vs Observed Magnitude
            </h3>
            <p className="text-[11px] text-slate-400">
              Red dashed line: Upper threshold boundary (μ + {config.threshold}σ). Blue line: Rolling prospective baseline mean.
            </p>
          </div>
        </div>
        <BaselineComparisonChart data={comparisonSeries} thresholdValue={config.threshold} />
      </div>

      {/* Chart 2: Z-Score Timeline */}
      <div className="observatory-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Individual Event Z-Score Timeline (σ Deviation)
            </h3>
            <p className="text-[11px] text-slate-400">
              z = (x - μ_rolling) / σ_rolling. Bars crossing the red dashed line (+{config.threshold}σ) are flagged.
            </p>
          </div>
        </div>
        <ZScoreTimelineChart data={zScoreSeries} threshold={config.threshold} />
      </div>

      {/* Chart 3: Separate 24h Frequency Analysis */}
      <div className="observatory-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Earthquake Frequency Clustering Analysis (24-Hour Intervals)
            </h3>
            <p className="text-[11px] text-slate-400">
              Event frequency and magnitude are calculated independently to avoid conflating clustered swarms with individual strong tremors.
            </p>
          </div>
        </div>
        <FrequencyChart buckets={frequencyBuckets} />
      </div>

      {/* Table: Flagged Observations Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Detailed Outlier Register & Explanations
        </h3>
        <FlaggedObservationsTable observations={observations} />
      </div>
    </div>
  );
}
