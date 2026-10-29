"use client";

import React from "react";
import { Sliders, RefreshCw, HelpCircle } from "lucide-react";
import { AnalyticsConfig } from "@/types/analytics";

interface AnomalyLabControlsProps {
  config: AnalyticsConfig;
  onChange: (newConfig: AnalyticsConfig) => void;
  onReset: () => void;
  isRecalculating?: boolean;
}

export function AnomalyLabControls({
  config,
  onChange,
  onReset,
  isRecalculating = false,
}: AnomalyLabControlsProps) {
  return (
    <div className="observatory-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-900 dark:text-white">
            Statistical Parameters & Baseline Window
          </h3>
        </div>

        <button
          onClick={onReset}
          className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline"
        >
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Rolling Baseline Window Size (N) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Window Size (N prior events)
            </span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
              {config.windowSize} events
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={config.windowSize}
            onChange={(e) =>
              onChange({ ...config, windowSize: parseInt(e.target.value, 10) })
            }
            className="w-full accent-sky-500 cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 leading-tight">
            Baseline depth: strictly prior events used to compute moving mean and sample standard deviation.
          </p>
        </div>

        {/* 2. Z-Score Anomaly Threshold (|z|) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Z-Score Threshold (|z| ≥)
            </span>
            <span className="font-mono font-bold text-amber-500">
              {config.threshold.toFixed(1)}σ
            </span>
          </div>
          <input
            type="range"
            min="1.5"
            max="4.0"
            step="0.1"
            value={config.threshold}
            onChange={(e) =>
              onChange({ ...config, threshold: parseFloat(e.target.value) })
            }
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 leading-tight">
            Heuristic sensitivity: events deviating by ≥ {config.threshold} standard deviations from prospective baseline.
          </p>
        </div>

        {/* 3. Minimum Baseline Count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Min Baseline Required
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {config.minBaseline} events
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="25"
            step="1"
            value={config.minBaseline}
            onChange={(e) =>
              onChange({ ...config, minBaseline: parseInt(e.target.value, 10) })
            }
            className="w-full accent-slate-500 cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 leading-tight">
            Early observations with fewer prior events are marked as insufficient baseline rather than false outliers.
          </p>
        </div>
      </div>
    </div>
  );
}
