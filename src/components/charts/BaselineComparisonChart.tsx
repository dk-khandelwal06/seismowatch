"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface BaselineChartItem {
  eventId: string;
  dateLabel: string;
  magnitude: number;
  baselineMean: number | null;
  upperThreshold: number | null;
  lowerThreshold: number | null;
  isAnomaly: boolean;
  zScore: number | null;
  place: string | null;
}

interface BaselineComparisonChartProps {
  data: BaselineChartItem[];
  thresholdValue: number;
}

export function BaselineComparisonChart({ data, thresholdValue }: BaselineComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-slate-400">
        No comparative baseline data available.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
          <XAxis
            dataKey="dateLabel"
            stroke="#94A3B8"
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#94A3B8"
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            domain={[1.5, "auto"]}
            unit="M"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item: BaselineChartItem = payload[0].payload;
                return (
                  <div className="p-3 rounded-lg bg-slate-900/95 border border-slate-700 text-xs text-white shadow-xl max-w-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400 text-sm">Observed: M{item.magnitude}</span>
                      {item.isAnomaly && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          OUTLIER |z|={Math.abs(item.zScore ?? 0)}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans truncate mt-1">{item.place}</p>
                    <div className="text-[10px] text-slate-400 mt-1 space-y-0.5 border-t border-slate-800 pt-1">
                      <div>Baseline Mean: {item.baselineMean ? `M${item.baselineMean}` : "Building..."}</div>
                      <div>Upper Envelope (+{thresholdValue}σ): {item.upperThreshold ? `M${item.upperThreshold}` : "—"}</div>
                      <div>Z-Score: {item.zScore !== null ? `${item.zScore > 0 ? "+" : ""}${item.zScore}` : "N/A"}</div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />

          {/* Upper Envelope Line */}
          <Line
            type="monotone"
            dataKey="upperThreshold"
            stroke="#EF4444"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            name={`Upper Bound (+${thresholdValue}σ)`}
            dot={false}
          />

          {/* Prospective Rolling Baseline Mean Line */}
          <Line
            type="monotone"
            dataKey="baselineMean"
            stroke="#38BDF8"
            strokeWidth={2}
            name="Prospective Rolling Mean"
            dot={false}
          />

          {/* Observed Magnitude */}
          <Line
            type="monotone"
            dataKey="magnitude"
            stroke="#94A3B8"
            strokeWidth={1}
            name="Observed Event M"
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.isAnomaly) {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#F59E0B"
                    stroke="#FEF3C7"
                    strokeWidth={2}
                    key={payload.eventId}
                  />
                );
              }
              return <circle cx={cx} cy={cy} r={2.5} fill="#64748B" key={payload.eventId} />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
