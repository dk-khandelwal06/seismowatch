"use client";

import React, { useEffect, useState } from "react";
import { Clock as ClockIcon } from "lucide-react";

export function ObservatoryClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="w-56 h-56 rounded-full border border-slate-700/50 flex items-center justify-center animate-pulse bg-slate-900/40">
        <ClockIcon className="w-6 h-6 text-slate-500" />
      </div>
    );
  }

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  // Degrees of rotation
  const secDeg = (seconds / 60) * 360;
  const minDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

  // Formatted local and UTC times
  const localTimeStr = time.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const utcTimeStr =
    String(time.getUTCHours()).padStart(2, "0") +
    ":" +
    String(time.getUTCMinutes()).padStart(2, "0") +
    ":" +
    String(time.getUTCSeconds()).padStart(2, "0") +
    " UTC";

  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56 rounded-full bg-slate-50/50 dark:bg-[#080D1A] border-2 border-slate-300 dark:border-sky-500/30 p-2 shadow-lg shadow-sky-950/10 flex items-center justify-center select-none group">
        {/* Outer Instrument Orbital Ring with tick marks */}
        <div className="absolute inset-1 rounded-full border border-dashed border-slate-300 dark:border-sky-500/20" />
        <div className="absolute inset-3 rounded-full border border-slate-200 dark:border-slate-800" />

        {/* Major Tick Marks (12, 3, 6, 9) */}
        <span className="absolute top-2.5 text-[9px] font-mono font-bold text-slate-400 dark:text-sky-400">12</span>
        <span className="absolute right-3 text-[9px] font-mono font-bold text-slate-400 dark:text-sky-400">03</span>
        <span className="absolute bottom-2.5 text-[9px] font-mono font-bold text-slate-400 dark:text-sky-400">06</span>
        <span className="absolute left-3 text-[9px] font-mono font-bold text-slate-400 dark:text-sky-400">09</span>

        {/* Minor Dial Ticks */}
        <div className="absolute inset-4 rounded-full border border-slate-200/50 dark:border-slate-800/60 pointer-events-none" />

        {/* Center Clock Hands Canvas */}
        <div className="relative w-36 h-36 rounded-full flex items-center justify-center">
          {/* Hour Hand */}
          <div
            className="absolute w-1 h-10 bg-slate-700 dark:bg-slate-200 rounded-full origin-bottom"
            style={{
              bottom: "50%",
              transform: `rotate(${hourDeg}deg)`,
              transition: "transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
            }}
          />

          {/* Minute Hand */}
          <div
            className="absolute w-0.5 h-14 bg-sky-600 dark:text-sky-300 dark:bg-sky-400 rounded-full origin-bottom"
            style={{
              bottom: "50%",
              transform: `rotate(${minDeg}deg)`,
              transition: "transform 0.1s ease-out",
            }}
          />

          {/* Second Hand */}
          <div
            className="absolute w-[1.5px] h-16 bg-amber-500 rounded-full origin-bottom z-10"
            style={{
              bottom: "50%",
              transform: `rotate(${secDeg}deg)`,
              transition: "transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)",
            }}
          >
            {/* Second counterweight */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-amber-600 rounded-full" />
          </div>

          {/* Center Pivot Jewel */}
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white dark:border-[#080D1A] z-20 shadow-sm" />
        </div>

        {/* Digital Time readout inside bottom arc */}
        <div className="absolute bottom-5 text-center pointer-events-none">
          <p className="font-mono text-xs font-bold tracking-wider text-slate-800 dark:text-slate-100">
            {localTimeStr}
          </p>
        </div>
      </div>

      {/* Sub-label indicators */}
      <div className="mt-2 text-center">
        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-sky-300">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>{utcTimeStr}</span>
        </div>
        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
          {dateStr} • Seismic Observation Ref
        </p>
      </div>
    </div>
  );
}
