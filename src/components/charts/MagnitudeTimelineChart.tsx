"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { StatisticalObservation } from "@/types/analytics";

interface MagnitudeTimelineChartProps {
  observations: StatisticalObservation[];
  onSelectEvent?: (eventId: string) => void;
}

export function MagnitudeTimelineChart({
  observations,
  onSelectEvent,
}: MagnitudeTimelineChartProps) {
  if (observations.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-slate-400">
        No observation records available for time-series visualization.
      </div>
    );
  }

  // Format data for Scatter plot
  const data = observations.map((o) => ({
    eventId: o.eventId,
    timeMs: new Date(o.eventTime).getTime(),
    dateStr: o.eventTime.substring(5, 16).replace("T", " "),
    magnitude: o.magnitude,
    depthKm: o.depthKm ?? 10,
    place: o.place || "Unspecified",
    isAnomaly: o.isAnomaly,
    zScore: o.zScore,
    baselineMean: o.baselineMean,
  }));

  const minTime = Math.min(...data.map((d) => d.timeMs));
  const maxTime = Math.max(...data.map((d) => d.timeMs));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
          <XAxis
            dataKey="timeMs"
            type="number"
            domain={[minTime, maxTime]}
            tickFormatter={(ms) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            stroke="#94A3B8"
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            name="Date"
          />
          <YAxis
            dataKey="magnitude"
            type="number"
            domain={[1.5, "auto"]}
            stroke="#94A3B8"
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            name="Magnitude"
            unit="M"
          />
          <ZAxis dataKey="depthKm" range={[40, 200]} name="Depth" unit="km" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-2.5 rounded-lg bg-slate-900/95 border border-slate-700 text-xs text-white shadow-xl max-w-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400 text-sm">M{item.magnitude}</span>
                      {item.isAnomaly && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          Z: {item.zScore > 0 ? "+" : ""}{item.zScore}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans truncate mt-1">{item.place}</p>
                    <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                      <div>Time: {item.dateStr} UTC</div>
                      <div>Depth: {item.depthKm} km</div>
                      {item.baselineMean !== null && <div>Baseline Mean: M{item.baselineMean}</div>}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            data={data}
            onClick={(node) => onSelectEvent && onSelectEvent(node.eventId)}
            cursor="pointer"
          >
            {data.map((entry) => {
              let fill = "#38BDF8";
              if (entry.isAnomaly) {
                fill = "#F59E0B"; // Amber for anomaly
              } else if (entry.magnitude >= 5.0) {
                fill = "#EF4444";
              }
              return (
                <Cell
                  key={entry.eventId}
                  fill={fill}
                  stroke={entry.isAnomaly ? "#FDE68A" : "#0284C7"}
                  strokeWidth={entry.isAnomaly ? 2 : 1}
                />
              );
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
