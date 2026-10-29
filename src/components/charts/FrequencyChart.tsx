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
import { FrequencyBucket } from "@/types/analytics";

interface FrequencyChartProps {
  buckets: FrequencyBucket[];
}

export function FrequencyChart({ buckets }: FrequencyChartProps) {
  if (buckets.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-slate-400">
        No frequency bucket data available.
      </div>
    );
  }

  const mean = buckets.length > 0 ? buckets[0].expectedMean : 0;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
          <XAxis
            dataKey="periodKey"
            stroke="#94A3B8"
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            tickFormatter={(key) => key.substring(5)} // MM-DD
          />
          <YAxis
            stroke="#94A3B8"
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            name="Daily Events"
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const b: FrequencyBucket = payload[0].payload;
                return (
                  <div className="p-2.5 rounded-lg bg-slate-900/95 border border-slate-700 text-xs text-white shadow-xl max-w-xs font-mono">
                    <div className="flex items-center justify-between font-bold text-sky-400">
                      <span>{b.periodKey}</span>
                      {b.isAnomaly && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">
                          SURGE z={b.zScore}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 mt-1 font-semibold">{b.count} events recorded</p>
                    <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                      <div>Baseline Avg: {b.expectedMean} events/day</div>
                      <div>Std Dev: ±{b.expectedStdDev}</div>
                      <div>Z-Score: {b.zScore >= 0 ? "+" : ""}{b.zScore}</div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={mean}
            stroke="#0EA5E9"
            strokeDasharray="4 4"
            label={{ value: `Avg (${mean})`, fill: "#0EA5E9", fontSize: 10, position: "insideTopRight" }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {buckets.map((entry, index) => {
              const fill = entry.isAnomaly ? "#F59E0B" : "#38BDF8";
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
