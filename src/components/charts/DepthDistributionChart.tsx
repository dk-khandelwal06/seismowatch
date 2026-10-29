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

interface DepthDistributionProps {
  earthquakes: Earthquake[];
}

export function DepthDistributionChart({ earthquakes }: DepthDistributionProps) {
  const bins = [
    { range: "0–30 km (Shallow)", count: 0, color: "#EF4444" },
    { range: "30–70 km (Interm)", count: 0, color: "#F59E0B" },
    { range: "70–150 km (Deep)", count: 0, color: "#38BDF8" },
    { range: ">150 km (V. Deep)", count: 0, color: "#818CF8" },
  ];

  for (const eq of earthquakes) {
    if (eq.depthKm === null) continue;
    if (eq.depthKm <= 30) bins[0].count++;
    else if (eq.depthKm <= 70) bins[1].count++;
    else if (eq.depthKm <= 150) bins[2].count++;
    else bins[3].count++;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 10, right: 15, bottom: 20, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
          <XAxis dataKey="range" stroke="#94A3B8" tick={{ fontSize: 9, fill: "#94A3B8" }} />
          <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fill: "#94A3B8" }} allowDecimals={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono">
                    <span className="font-bold text-sky-400">{item.range}: </span>
                    <span>{item.count} events</span>
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
