"use client";

import React, { useEffect, useState } from "react";
import { Earthquake } from "@/types/earthquake";
import {
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
import { AtmosphericHero } from "@/components/observatory/AtmosphericHero";
import { LiveIndicator } from "@/components/observatory/LiveIndicator";
import { QuickStats } from "@/components/observatory/QuickStats";
import { EarthquakeMap } from "@/components/maps/EarthquakeMap";
import { MagnitudeTimelineChart } from "@/components/charts/MagnitudeTimelineChart";
import { FrequencyChart } from "@/components/charts/FrequencyChart";
import { EarthquakeTable } from "@/components/earthquakes/EarthquakeTable";
import { AlertTriangle, ArrowRight, MapPin, BarChart3, Layers } from "lucide-react";
import Link from "next/link";

export default function ObservatoryDashboardPage() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [observations, setObservations] = useState<StatisticalObservation[]>([]);
  const [frequencyBuckets, setFrequencyBuckets] = useState<FrequencyBucket[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>(new Date().toISOString());
  const [dataSource, setDataSource] = useState<string>("UPSTREAM_USGS");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      if (forceRefresh) {
        await fetch("/api/ingestion/refresh", { method: "POST" });
      }

      const res = await fetch("/api/earthquakes?limit=150");
      if (!res.ok) {
        throw new Error(`Catalog query failed with status ${res.status}`);
      }

      const payload = await res.json();
      const events: Earthquake[] = payload.data || [];

      setEarthquakes(events);
      setLastFetchedAt(payload.lastFetchedAt || new Date().toISOString());
      setDataSource(payload.source || "UPSTREAM_USGS");

      // Compute prospective statistical analysis client-side
      const obs = calculateMagnitudeAnomalies(events, DEFAULT_ANALYTICS_CONFIG);
      const freq = calculateFrequencyAnomalies(events, 24, DEFAULT_ANALYTICS_CONFIG.threshold);
      const sum = buildAnalyticsSummary(obs, freq, DEFAULT_ANALYTICS_CONFIG);

      setObservations(obs);
      setFrequencyBuckets(freq);
      setSummary(sum);
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to retrieve earthquake observations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestEventTime = earthquakes.length > 0 ? earthquakes[0].eventTime : undefined;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Atmospheric Hero with Observatory Clock & Radar */}
      <AtmosphericHero recentEarthquakes={earthquakes} />

      {/* 2. Live Activity Indicator & Refresh Control */}
      <LiveIndicator
        lastFetchedAt={lastFetchedAt}
        latestEventTime={latestEventTime}
        source={dataSource}
        onRefresh={() => loadData(true)}
      />

      {/* Error state if API fails */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-mono flex items-center justify-between">
          <span>Failed to connect to seismic data source: {error}</span>
          <button
            onClick={() => loadData(true)}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 3. QuickStats KPIs */}
      <QuickStats
        totalCount={earthquakes.length}
        earthquakes={earthquakes}
        observations={observations}
      />

      {/* 4. Main Geospatial Map & Anomaly Callout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Regional Seismic Map Preview (6–38°N, 68–98°E)
              </h2>
            </div>
            <Link
              href="/map"
              className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
            >
              <span>Full Screen Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <EarthquakeMap earthquakes={earthquakes} height="460px" />
        </div>

        {/* Right Column: Anomaly Summary & Frequency Overview */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          {/* Anomaly Laboratory Callout Card */}
          <div className="observatory-card p-5 space-y-3 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
                  Statistical Anomaly Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                |z| ≥ 2.0σ
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Using a rolling prospective baseline of 30 prior observations (excluding the event itself), SeismoWatch has identified{" "}
              <strong className="text-amber-500 font-mono">
                {observations.filter((o) => o.isAnomaly).length} magnitude outliers
              </strong>{" "}
              and{" "}
              <strong className="text-sky-500 font-mono">
                {frequencyBuckets.filter((b) => b.isAnomaly).length} frequency surges
              </strong>{" "}
              in the current catalog interval.
            </p>

            <div className="pt-1">
              <Link
                href="/analytics"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-medium transition-colors"
              >
                <span>Open Anomaly Laboratory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Daily Frequency Histogram */}
          <div className="observatory-card p-4 space-y-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  24-Hour Event Frequency
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Regional daily count</span>
            </div>
            <FrequencyChart buckets={frequencyBuckets.slice(-14)} />
          </div>
        </div>
      </div>

      {/* 5. Magnitude Timeline Scatter Plot */}
      <div className="observatory-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Magnitude Observations Over Time
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Amber nodes indicate z-score magnitude outliers
          </span>
        </div>
        <MagnitudeTimelineChart observations={observations} />
      </div>

      {/* 6. Recent Observations Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Recent Regional Earthquakes
            </h2>
          </div>
          <Link
            href="/earthquakes"
            className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
          >
            <span>View Full Live Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <EarthquakeTable
          earthquakes={earthquakes.slice(0, 10)}
          totalCount={earthquakes.length}
          currentPage={1}
          pageSize={10}
          onPageChange={() => {}}
          sortBy="eventTime"
          sortOrder="desc"
          onSortChange={() => {}}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
