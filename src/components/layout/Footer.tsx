"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ExternalLink, Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060911] text-xs transition-colors mt-12">
      {/* Top Banner: Mandatory Scientific Notice */}
      <div className="bg-amber-500/10 dark:bg-amber-950/20 border-b border-amber-500/20 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-start space-x-2 text-amber-900 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>MANDATORY SCIENTIFIC NOTICE:</strong> SeismoWatch does not predict earthquakes, guarantee advance warning,
            or establish that a statistical anomaly forecasts a future seismic event. Rolling-window z-scores and frequency metrics
            are retrospective exploratory signals only. Earthquakes cannot currently be predicted by any scientific agency.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-2 md:col-span-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white">
                Seismo<span className="text-sky-500">Watch</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Observe the Earth. Understand the Signals.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Geospatial monitoring and statistical anomaly analysis across the Indian Subcontinent and Himalayan mountain belt.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-900 dark:text-white mb-2">
              Observatory Views
            </h4>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-sky-500 transition-colors">
                  Overview Dashboard
                </Link>
              </li>
              <li>
                <Link href="/earthquakes" className="hover:text-sky-500 transition-colors">
                  Live Earthquake Catalog
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-sky-500 transition-colors">
                  Interactive Geospatial Map
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-sky-500 transition-colors">
                  Anomaly Laboratory
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-sky-500 transition-colors">
                  Historical Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Science & Methodology */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-900 dark:text-white mb-2">
              Scientific Reference
            </h4>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/methodology" className="hover:text-sky-500 transition-colors">
                  Statistical Methodology
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-sky-500 transition-colors">
                  System Architecture & Security
                </Link>
              </li>
              <li>
                <a
                  href="https://earthquake.usgs.gov/fdsnws/event/1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-sky-500 transition-colors"
                >
                  <span>USGS API Specification</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://earthquake.usgs.gov/data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-sky-500 transition-colors"
                >
                  <span>USGS Earthquake Hazards</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Data Source & Coverage */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-900 dark:text-white mb-2">
              Coverage & Ingestion
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Official USGS Earthquake API. Bounding box coordinates:
              <br />
              <strong className="text-slate-700 dark:text-slate-300 font-mono">
                Lat 6°N–38°N • Lon 68°E–98°E
              </strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              Data is deduplicated using stable USGS event identifiers and validated prior to statistical processing.
            </p>
          </div>
        </div>

        <div className="hairline-t mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} SeismoWatch. Open scientific observation platform.</p>
          <p className="font-mono mt-2 sm:mt-0">Bounding Box: Indian Subcontinent & Himalayan Seismic Belt</p>
        </div>
      </div>
    </footer>
  );
}
