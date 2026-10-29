"use client";

import React, { useState } from "react";
import { Earthquake } from "@/types/earthquake";
import { Radio, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface SeismicRadarProps {
  earthquakes: Earthquake[];
}

export function SeismicRadar({ earthquakes }: SeismicRadarProps) {
  const [hoveredEvent, setHoveredEvent] = useState<Earthquake | null>(null);

  // Center coordinate of our observation bounding box: 22°N, 83°E
  const centerLat = 22.0;
  const centerLon = 83.0;
  const maxDistanceDeg = 16.0; // Max radius in degrees covering 6-38°N, 68-98°E

  // Map earthquakes to polar coordinates (radius in % from center, angle in radians/degrees)
  const radarPoints = earthquakes
    .filter((e) => e.latitude !== null && e.longitude !== null && e.magnitude !== null)
    .slice(0, 40) // Top 40 recent events
    .map((event) => {
      const dLat = event.latitude! - centerLat;
      const dLon = (event.longitude! - centerLon) * Math.cos((centerLat * Math.PI) / 180);

      const distance = Math.sqrt(dLat * dLat + dLon * dLon);
      const normalizedRadius = Math.min(46, (distance / maxDistanceDeg) * 44 + 4); // 4% to 48% radius

      const angleRad = Math.atan2(dLat, dLon); // -PI to PI
      const xPercent = 50 + normalizedRadius * Math.cos(angleRad);
      const yPercent = 50 - normalizedRadius * Math.sin(angleRad); // Invert Y for screen

      return {
        event,
        xPercent,
        yPercent,
        mag: event.magnitude!,
      };
    });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-[#080D1A] border-2 border-sky-500/30 overflow-hidden shadow-xl shadow-sky-950/20 select-none">
        {/* Polar Range Rings */}
        <div className="absolute inset-4 rounded-full border border-sky-500/15" />
        <div className="absolute inset-14 rounded-full border border-sky-500/20" />
        <div className="absolute inset-24 rounded-full border border-sky-500/25" />
        <div className="absolute w-2 h-2 rounded-full bg-sky-400 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-sm shadow-sky-400" />

        {/* Crosshair Axes */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-sky-500/20 -translate-x-1/2" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-sky-500/20 -translate-y-1/2" />

        {/* Cardinal Directions */}
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-sky-400/80">N (38°)</span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-sky-400/80">S (6°)</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-sky-400/80">E (98°)</span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-sky-400/80">W (68°)</span>

        {/* Rotating Radar Sweep Cone */}
        <div
          className="absolute inset-0 pointer-events-none origin-center animate-radar-sweep"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(56, 189, 248, 0.28) 0deg, rgba(56, 189, 248, 0.05) 45deg, transparent 60deg, transparent 360deg)",
          }}
        />

        {/* Real Earthquake Event Markers */}
        {radarPoints.map(({ event, xPercent, yPercent, mag }, idx) => {
          const isMajor = mag >= 5.0;
          const isModerate = mag >= 4.0;
          const dotColor = isMajor
            ? "bg-red-500 border-red-300 shadow-red-500"
            : isModerate
            ? "bg-amber-400 border-amber-200 shadow-amber-400"
            : "bg-sky-400 border-sky-200 shadow-sky-400";

          const dotSize = isMajor ? "w-3 h-3" : isModerate ? "w-2.5 h-2.5" : "w-2 h-2";

          return (
            <button
              key={event.eventId || idx}
              onClick={() => setHoveredEvent(event)}
              onMouseEnter={() => setHoveredEvent(event)}
              aria-label={`Earthquake M${mag} at ${event.place}`}
              style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${dotSize} rounded-full border ${dotColor} shadow-sm transition-transform hover:scale-150 focus:outline-none focus:scale-150 z-20 cursor-pointer`}
            />
          );
        })}
      </div>

      {/* Legend & Active Event Callout */}
      <div className="mt-3 w-full max-w-xs text-center">
        {hoveredEvent ? (
          <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-sky-500/30 text-left text-xs animate-in fade-in">
            <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-sky-300">
              <span>M{hoveredEvent.magnitude?.toFixed(1) || "—"}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                {formatRelativeTime(hoveredEvent.eventTime)}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate mt-0.5">
              {hoveredEvent.place}
            </p>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Depth: {hoveredEvent.depthKm ?? "—"} km • {hoveredEvent.latitude?.toFixed(2)}°N, {hoveredEvent.longitude?.toFixed(2)}°E
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>M5+ Major</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>M4–5 Moderate</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>M2–4 Minor</span>
            </span>
          </div>
        )}

        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Polar projection of actual USGS events relative to regional center (22°N, 83°E).
        </p>
      </div>
    </div>
  );
}
