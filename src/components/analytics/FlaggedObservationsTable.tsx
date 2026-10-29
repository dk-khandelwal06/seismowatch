"use client";

import React from "react";
import { StatisticalObservation } from "@/types/analytics";
import { formatUTC, formatRelativeTime } from "@/lib/utils";
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface FlaggedObservationsTableProps {
  observations: StatisticalObservation[];
  onSelectEvent?: (eventId: string) => void;
}

export function FlaggedObservationsTable({
  observations,
  onSelectEvent,
}: FlaggedObservationsTableProps) {
  const anomalies = observations.filter((o) => o.isAnomaly);

  if (anomalies.length === 0) {
    return (
      <div className="observatory-card p-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No statistical magnitude anomalies flagged
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          All observations in the active sequence fall within the configured prospective baseline envelope.
        </p>
      </div>
    );
  }

  return (
    <div className="observatory-card overflow-hidden">
      <div className="p-4 hairline-b bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Flagged Magnitude Outliers ({anomalies.length})
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Strictly prospective baseline comparison
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="hairline-b bg-slate-50/80 dark:bg-slate-900/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">
              <th className="py-2.5 px-4">Magnitude</th>
              <th className="py-2.5 px-4">Z-Score</th>
              <th className="py-2.5 px-4">Place / Event ID</th>
              <th className="py-2.5 px-4">Event Time (UTC)</th>
              <th className="py-2.5 px-4">Baseline Comparison</th>
              <th className="py-2.5 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {anomalies.map((obs) => (
              <tr
                key={obs.eventId}
                onClick={() => onSelectEvent && onSelectEvent(obs.eventId)}
                className="hover:bg-amber-500/5 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                {/* Magnitude */}
                <td className="py-3 px-4 font-mono whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                    M{obs.magnitude.toFixed(1)}
                  </span>
                </td>

                {/* Z-Score badge */}
                <td className="py-3 px-4 font-mono whitespace-nowrap">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40">
                    <span>▲</span>
                    <span>+{obs.zScore}σ</span>
                  </span>
                </td>

                {/* Location */}
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-sky-500 transition-colors">
                    {obs.place || "Himalayan Region"}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{obs.eventId}</span>
                </td>

                {/* Event Time */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-mono text-slate-800 dark:text-slate-200">
                    {formatUTC(obs.eventTime)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatRelativeTime(obs.eventTime)}
                  </div>
                </td>

                {/* Baseline Comparison */}
                <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    Mean: M{obs.baselineMean} ± {obs.baselineStdDev}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    From {obs.baselineSize} prior events
                  </span>
                </td>

                {/* Detail Link */}
                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/earthquakes/${obs.eventId}`}
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
