"use client";

import React from "react";
import { BookOpen, ExternalLink, ShieldAlert, Cpu, Database, Compass, CheckCircle2 } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sky-500 text-xs font-mono uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Scientific Protocol & Mathematical Foundations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Methodology & Data Sources
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete documentation of data ingestion pipelines, geographic boundaries, rolling prospective
          baseline statistics, and scientific limitations.
        </p>
      </div>

      {/* Critical Scientific Notice */}
      <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider font-mono">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>CRITICAL SCIENTIFIC DISCLAIMER: NON-PREDICTIVE EXPLORATION</span>
        </div>
        <p className="text-xs leading-relaxed">
          SeismoWatch does not predict earthquakes, provide early warnings, or establish that an anomaly
          predicts future seismic activity. Earthquakes are complex, non-linear geological phenomena that
          cannot currently be predicted by any scientific agency or mathematical algorithm. In this system,
          an &quot;anomaly&quot; refers strictly to a historical mathematical outlier within a rolling statistical
          window, intended solely for retrospective exploratory signal analysis.
        </p>
      </div>

      {/* Section 1: USGS Earthquake Catalog Integration */}
      <div className="observatory-card p-6 space-y-4">
        <div className="flex items-center space-x-2 text-sky-500">
          <Compass className="w-4 h-4" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            1. Data Acquisition & Geographic Bounding Box
          </h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          SeismoWatch pulls real earthquake observations directly from the official United States Geological Survey
          (USGS) Earthquake API using the FDSNWS event query specification:
        </p>

        <div className="p-3 rounded-lg bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto">
          https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6&maxlatitude=38&minlongitude=68&maxlongitude=98
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 text-[10px] block uppercase">Latitude Scope</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">6.0° N to 38.0° N</span>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              From the Indian Ocean and southern tip of India up to Kashmir, Ladakh, and the Tibetan Plateau.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 text-[10px] block uppercase">Longitude Scope</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">68.0° E to 98.0° E</span>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              From the western border of Gujarat and Pakistan through Nepal, Bhutan, and the Indo-Burman ranges.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Observations are parsed and sanitized for null values, invalid coordinates, and timestamp boundaries.
          Deduplication is performed using the stable USGS event identifier (e.g. <code>us7000xxxx</code>),
          preserving the most recently updated catalog revision when updates occur.
        </p>

        <a
          href="https://earthquake.usgs.gov/data/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline pt-1"
        >
          <span>Official USGS Earthquake Hazards Documentation</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Section 2: Mathematical Anomaly Detection */}
      <div className="observatory-card p-6 space-y-4">
        <div className="flex items-center space-x-2 text-amber-500">
          <Cpu className="w-4 h-4" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            2. Rolling Prospective Baseline & Z-Score Mathematics
          </h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          The statistical engine calculates moving sample statistics along a chronological sequence of events.
          To maintain strict scientific integrity, the baseline calculation is <strong>strictly prospective</strong>:
          the observation under evaluation is excluded from its own baseline to avoid self-contamination.
        </p>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3 font-mono text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">1. Baseline Selection</span>
            <p className="text-slate-800 dark:text-slate-200">
              Baseline = [ x_(i-N) , x_(i-N+1) , ... , x_(i-1) ]
            </p>
            <span className="text-[10px] text-slate-500 font-sans">
              Where N is the configurable window size (default 30) and x_i is the current event.
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">2. Rolling Mean (μ) & Sample Standard Deviation (σ)</span>
            <p className="text-slate-800 dark:text-slate-200">
              μ = (1 / N) * ∑ x_k
            </p>
            <p className="text-slate-800 dark:text-slate-200">
              σ = √ [ (1 / (N - 1)) * ∑ (x_k - μ)² ]
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">3. Standardized Score (Z-Score)</span>
            <p className="text-amber-500 font-bold text-sm">
              z = (x_i - μ) / σ
            </p>
            <span className="text-[10px] text-slate-500 font-sans">
              Measures how many standard deviations the current magnitude x_i departs from recent regional history.
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <h4 className="font-bold text-slate-900 dark:text-white font-mono text-xs uppercase">
            Safe Handling of Boundary Conditions
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Insufficient Baseline:</strong> Early observations where the number of available prior events is less
              than the minimum baseline (default 10) are labeled as <code>INSUFFICIENT_BASELINE</code> with a null z-score,
              never misclassified as anomalies.
            </li>
            <li>
              <strong>Zero Standard Deviation:</strong> If all prior events possess identical magnitudes (σ &lt; 0.0001),
              the z-score is safely handled as 0.0 to prevent division by zero, <code>NaN</code>, or infinite values.
            </li>
            <li>
              <strong>Magnitude vs Frequency Separation:</strong> Individual event magnitude deviations are calculated separately
              from daily event frequency surges. They are never combined into a single ambiguous composite score.
            </li>
          </ul>
        </div>
      </div>

      {/* Section 3: Limitations of Global Seismic Catalogs */}
      <div className="observatory-card p-6 space-y-4">
        <div className="flex items-center space-x-2 text-sky-500">
          <Database className="w-4 h-4" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            3. Catalog Completeness & Instrument Limitations
          </h2>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            When interpreting regional earthquake statistics, users must consider the fundamental limitations of global seismological networks:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Magnitude of Completeness (Mc):</strong> In the Himalayan region, the global USGS catalog is generally complete
              above M3.5 to M4.0. Smaller regional events (M2.0–M3.0) may be selectively registered depending on proximity to
              participating seismic stations in India, Nepal, and China.
            </li>
            <li>
              <strong>Hypocentral Depth Uncertainties:</strong> Focal depths determined from teleseismic arrivals without tight local array
              coverage often carry uncertainties of ±5 to ±15 km. Fixed default depths (e.g. 10.0 km) are sometimes assigned by
              catalog analysts when depth cannot be independently constrained.
            </li>
            <li>
              <strong>Catalog Revision Latency:</strong> Preliminary event parameters are published within minutes of occurrence, but
              subsequent analyst reviews may update magnitudes (e.g. from initial <code>mb</code> to moment tensor <code>Mww</code>)
              and refine hypocenters hours or days later.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
