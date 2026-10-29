"use client";

import React from "react";
import { Earthquake } from "@/types/earthquake";
import { StatisticalObservation } from "@/types/analytics";
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Compass,
  Layers,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface QuickStatsProps {
  totalCount: number;
  earthquakes: Earthquake[];
  observations: StatisticalObservation[];
}

export function QuickStats({ totalCount, earthquakes, observations }: QuickStatsProps) {
  // Compute KPIs
  const latestEvent = earthquakes.length > 0 ? earthquakes[0] : null;

  let peakMagEvent: Earthquake | null = null;
  let maxDepthEvent: Earthquake | null = null;
  let magSum = 0;
  let validMagCount = 0;

  for (const eq of earthquakes) {
    if (eq.magnitude !== null) {
      magSum += eq.magnitude;
      validMagCount++;
      if (!peakMagEvent || eq.magnitude > (peakMagEvent.magnitude ?? 0)) {
        peakMagEvent = eq;
      }
    }
    if (eq.depthKm !== null) {
      if (!maxDepthEvent || eq.depthKm > (maxDepthEvent.depthKm ?? 0)) {
        maxDepthEvent = eq;
      }
    }
  }

  const avgMag = validMagCount > 0 ? (magSum / validMagCount).toFixed(1) : "—";
  const anomaliesCount = observations.filter((o) => o.isAnomaly).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Catalog Count */}
      <div className="observatory-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">Observations</span>
          <Activity className="w-4 h-4 text-sky-500" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            USGS Bounding Box (6–38°N)
          </p>
        </div>
      </div>

      {/* 2. Latest Earthquake */}
      <div className="observatory-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">Latest Event</span>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {latestEvent ? `M${latestEvent.magnitude?.toFixed(1) || "—"}` : "—"}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={latestEvent?.place || ""}>
            {latestEvent ? formatRelativeTime(latestEvent.eventTime) : "No events"}
          </p>
        </div>
      </div>

      {/* 3. Peak Magnitude */}
      <div className="observatory-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">Peak Magnitude</span>
          <TrendingUp className="w-4 h-4 text-red-500" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
            {peakMagEvent ? `M${peakMagEvent.magnitude?.toFixed(1)}` : "—"}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={peakMagEvent?.place || ""}>
            {peakMagEvent?.place || "—"}
          </p>
        </div>
      </div>

      {/* 4. Flagged Magnitude Anomalies */}
      <div className="observatory-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">Z-Anomalies</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <p className="text-2xl font-bold font-mono text-amber-500">
              {anomaliesCount}
            </p>
            <span className="text-[10px] font-mono text-slate-400">|z| ≥ 2.0</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Statistical Outliers
          </p>
        </div>
      </div>

      {/* 5. Average Magnitude */}
      <div className="observatory-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">Mean Magnitude</span>
          <Compass className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200">
            {avgMag !== "—" ? `M${avgMag}` : "—"}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Active Dataset Baseline
          </p>
        </div>
      </div>

      {/* 6. Maximum Depth */}
      <div className="observatory-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">Deepest Focus</span>
          <Layers className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {maxDepthEvent?.depthKm ? `${maxDepthEvent.depthKm} km` : "—"}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={maxDepthEvent?.place || ""}>
            {maxDepthEvent?.place || "Subduction zone"}
          </p>
        </div>
      </div>
    </div>
  );
}
