"use client";

import React, { useEffect, useState } from "react";
import { Earthquake } from "@/types/earthquake";
import { MagnitudeDistributionChart } from "@/components/charts/MagnitudeDistributionChart";
import { DepthDistributionChart } from "@/components/charts/DepthDistributionChart";
import { FrequencyChart } from "@/components/charts/FrequencyChart";
import { calculateFrequencyAnomalies } from "@/lib/analytics/engine";
import { LiveIndicator } from "@/components/observatory/LiveIndicator";
import {
  History,
  Download,
  Calendar,
  Layers,
  Activity,
  BarChart2,
  Sliders,
} from "lucide-react";
import { formatUTC } from "@/lib/utils";

export default function HistoricalExplorerPage() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>(new Date().toISOString());
  const [dataSource, setDataSource] = useState<string>("UPSTREAM_USGS");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Time Range Filter (7d, 14d, 30d, all)
  const [daysFilter, setDaysFilter] = useState<number>(30);

  const loadData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      if (forceRefresh) {
        await fetch("/api/ingestion/refresh", { method: "POST" });
      }
      const res = await fetch("/api/earthquakes?limit=250");
      if (res.ok) {
        const payload = await res.json();
        setEarthquakes(payload.data || []);
        setLastFetchedAt(payload.lastFetchedAt || new Date().toISOString());
        setDataSource(payload.source || "UPSTREAM_USGS");
      }
    } catch (err) {
      console.error("Historical data fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter earthquakes by selected days
  const cutoffMs = Date.now() - daysFilter * 24 * 3600 * 1000;
  const filteredEvents = earthquakes.filter((e) => e.eventTimeMs >= cutoffMs);

  const frequencyBuckets = calculateFrequencyAnomalies(filteredEvents, 24, 2.0);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = [
      "Event ID",
      "Magnitude",
      "Mag Type",
      "Place",
      "Event Time (UTC)",
      "Depth (km)",
      "Latitude",
      "Longitude",
    ];
    const rows = filteredEvents.map((e) => [
      `"${e.eventId}"`,
      e.magnitude ?? "",
      `"${e.magnitudeType || ""}"`,
      `"${(e.place || "").replace(/"/g, '""')}"`,
      `"${e.eventTime}"`,
      e.depthKm ?? "",
      e.latitude ?? "",
      e.longitude ?? "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seismowatch_historical_${daysFilter}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-500 text-xs font-mono uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Temporal Archives • Distribution Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Historical Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Explore magnitude and depth distributions, daily clustering, and time-series records
            within the active catalog interval.
          </p>
        </div>

        {/* Date Interval Selector & CSV Export */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  daysFilter === d
                    ? "bg-sky-600 text-white font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Last {d}D
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-mono transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <LiveIndicator
        lastFetchedAt={lastFetchedAt}
        latestEventTime={earthquakes[0]?.eventTime}
        source={dataSource}
        onRefresh={() => loadData(true)}
      />

      {/* Dual Histograms: Magnitude Distribution & Depth Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Magnitude Histogram */}
        <div className="observatory-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Magnitude Distribution (Guttenberg-Richter Trend)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Events by magnitude class</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Natural seismic activity follows a logarithmic distribution where lower magnitudes occur with exponentially higher frequency.
          </p>
          <MagnitudeDistributionChart earthquakes={filteredEvents} />
        </div>

        {/* Depth Histogram */}
        <div className="observatory-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Focal Depth Stratification (Hypocenter)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">0–30km, 30–70km, &gt;70km</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Shallow crustal earthquakes (&lt;30 km) produce the highest surface ground shaking in the Himalayan collision zone.
          </p>
          <DepthDistributionChart earthquakes={filteredEvents} />
        </div>
      </div>

      {/* Daily Event Count Timeline */}
      <div className="observatory-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Daily Event Counts (24-Hour Intervals)
            </h3>
            <p className="text-[11px] text-slate-400">
              Aggregated daily frequency for the selected {daysFilter}-day window.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-sky-500">
            {filteredEvents.length} total events
          </span>
        </div>
        <FrequencyChart buckets={frequencyBuckets} />
      </div>

      {/* Scientific Historical Disclaimer */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400">
        <h4 className="font-mono font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300 mb-1">
          Historical Catalog Boundary Notice
        </h4>
        <p className="leading-relaxed">
          The records displayed are constrained to observations retrieved from the USGS Earthquake API
          within the configured bounding box and time limits. This application does not claim to hold
          historical records older than the actual synchronized database archive.
        </p>
      </div>
    </div>
  );
}
