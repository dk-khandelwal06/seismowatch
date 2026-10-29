"use client";

import React from "react";
import { ObservatoryClock } from "./ObservatoryClock";
import { SeismicRadar } from "./SeismicRadar";
import { Earthquake } from "@/types/earthquake";
import { Compass, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";

interface AtmosphericHeroProps {
  recentEarthquakes: Earthquake[];
}

export function AtmosphericHero({ recentEarthquakes }: AtmosphericHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-sky-50/30 to-white dark:from-[#080D1A] dark:via-[#0B101E] dark:to-[#060911] himalayan-contours p-6 sm:p-8 lg:p-10 shadow-sm transition-colors">
      {/* Decorative Topographic Radial Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Mission statement & Branding */}
        <div className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            <span>SEISMIC OBSERVATION STATION • 6–38°N, 68–98°E</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Observe the Earth.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-amber-500 dark:from-sky-400 dark:via-sky-300 dark:to-amber-400">
              Understand the Signals.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            Real-time seismic catalog monitoring and prospective rolling-window statistical anomaly
            analysis across the Indian Subcontinent and Himalayan mountain belt.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/earthquakes"
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md shadow-sky-600/20 transition-all hover:-translate-y-0.5"
            >
              Explore Live Catalog
            </Link>
            <Link
              href="/analytics"
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-xs transition-all"
            >
              Launch Anomaly Lab
            </Link>
            <Link
              href="/map"
              className="px-4 py-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs transition-colors"
            >
              Geospatial Map →
            </Link>
          </div>

          {/* Scientific Disclaimer Badge */}
          <div className="pt-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Scientific Notice:</strong> Statistical anomalies are exploratory mathematical signals only.
                SeismoWatch does not predict earthquakes or forecast seismic events.
              </span>
            </p>
          </div>
        </div>

        {/* Right Column: Signature Instruments (Clock & Radar) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-items-center">
          {/* Feature 1: The Observatory Clock */}
          <div className="w-full flex flex-col items-center p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Observatory Clock
            </div>
            <ObservatoryClock />
          </div>

          {/* Feature 2: The Seismic Radar */}
          <div className="w-full flex flex-col items-center p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Seismic Radar (Himalayan Belt)
            </div>
            <SeismicRadar earthquakes={recentEarthquakes} />
          </div>
        </div>
      </div>
    </section>
  );
}
