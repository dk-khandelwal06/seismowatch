"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";

interface ZScoreItem {
  eventId: string;
  dateLabel: string;
  zScore: number | null;
  magnitude: number;
  place: string | null;
  isAnomaly: boolean;
}

interface ZScoreTimelineChartProps {
  data: ZScoreItem[];
  threshold: number;
}

export function ZScoreTimelineChart({ data, threshold }: ZScoreTimelineChartProps) {
  const validData = data.filter((d) => d.zScore !== null) as (ZScoreItem & { zScore: number })[];

  if (validData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-slate-400">
        Insufficient baseline to compute z-scores.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={validData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
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
            domain={[-3.5, "auto"]}
            name="Z-Score (σ)"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ZScoreItem & { zScore: number };
                return (
                  <div className="p-2.5 rounded-lg bg-slate-900/95 border border-slate-700 text-xs text-white shadow-xl max-w-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">
                        Z = {item.zScore > 0 ? "+" : ""}{item.zScore}
                      </span>
                      {item.isAnomaly && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          OUTLIER
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans truncate mt-1">{item.place}</p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Event Magnitude: M{item.magnitude} • Date: {item.dateLabel}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Threshold Lines */}
          <ReferenceLine
            y={threshold}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{ value: `+${threshold}σ Anomaly`, fill: "#EF4444", fontSize: 9, position: "top" }}
          />
          <ReferenceLine
            y={-threshold}
            stroke="#64748B"
            strokeDasharray="3 3"
            label={{ value: `-${threshold}σ`, fill: "#64748B", fontSize: 9, position: "bottom" }}
          />
          <ReferenceLine y={0} stroke="#38BDF8" strokeWidth={1} />

          <Bar dataKey="zScore" radius={[2, 2, 0, 0]}>
            {validData.map((entry, index) => {
              let fill = "#38BDF8";
              if (entry.isAnomaly) {
                fill = "#F59E0B";
              } else if (entry.zScore < 0) {
                fill = "#64748B";
              }
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
