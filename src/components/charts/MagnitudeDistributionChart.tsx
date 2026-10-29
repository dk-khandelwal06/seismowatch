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
} from "recharts";
import { Earthquake } from "@/types/earthquake";

interface MagnitudeDistributionProps {
  earthquakes: Earthquake[];
}

export function MagnitudeDistributionChart({ earthquakes }: MagnitudeDistributionProps) {
  const bins = [
    { range: "M2.0–2.9", count: 0, color: "#10B981" },
    { range: "M3.0–3.9", count: 0, color: "#38BDF8" },
    { range: "M4.0–4.9", count: 0, color: "#0284C7" },
    { range: "M5.0–5.9", count: 0, color: "#F59E0B" },
    { range: "M6.0+", count: 0, color: "#EF4444" },
  ];

  for (const eq of earthquakes) {
    if (eq.magnitude === null) continue;
    if (eq.magnitude < 3.0) bins[0].count++;
    else if (eq.magnitude < 4.0) bins[1].count++;
    else if (eq.magnitude < 5.0) bins[2].count++;
    else if (eq.magnitude < 6.0) bins[3].count++;
    else bins[4].count++;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 10, right: 15, bottom: 20, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
          <XAxis dataKey="range" stroke="#94A3B8" tick={{ fontSize: 10, fill: "#94A3B8" }} />
          <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fill: "#94A3B8" }} allowDecimals={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono">
                    <span className="font-bold text-sky-400">{item.range}: </span>
                    <span>{item.count} events ({Math.round((item.count / (earthquakes.length || 1)) * 100)}%)</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {bins.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
