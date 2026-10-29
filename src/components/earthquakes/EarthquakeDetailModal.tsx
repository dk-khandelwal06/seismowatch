"use client";

import React from "react";
import { Earthquake } from "@/types/earthquake";
import { X, ExternalLink, ShieldAlert, MapPin, Clock, Layers, Activity } from "lucide-react";
import { formatUTC, formatRelativeTime, getMagnitudeBadge } from "@/lib/utils";
import Link from "next/link";

interface EarthquakeDetailModalProps {
  event: Earthquake;
  onClose: () => void;
}

export function EarthquakeDetailModal({ event, onClose }: EarthquakeDetailModalProps) {
  const badge = getMagnitudeBadge(event.magnitude);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0B101E] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3 mb-4">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xl font-mono font-bold ${badge.bg} ${badge.text} ${badge.border}`}
          >
            M{event.magnitude !== null ? event.magnitude.toFixed(1) : "—"}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {event.place || "Unspecified Regional Tremor"}
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              USGS Event ID: <span className="text-sky-500">{event.eventId}</span>
            </p>
          </div>
        </div>

        {/* Observation Attributes Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 font-mono text-xs mb-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Event Time (UTC)</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatUTC(event.eventTime)}
            </span>
            <span className="text-[10px] text-slate-500 block">({formatRelativeTime(event.eventTime)})</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Focal Depth</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {event.depthKm !== null ? `${event.depthKm} km` : "Depth Unreported"}
            </span>
            <span className="text-[10px] text-slate-500 block">Hypocenter depth</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Coordinates</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {event.latitude?.toFixed(3)}°N, {event.longitude?.toFixed(3)}°E
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Magnitude Type</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {event.magnitudeType ? event.magnitudeType.toUpperCase() : "Unspecified scale"}
            </span>
            {event.significance !== null && (
              <span className="text-[10px] text-slate-500 block">Sig index: {event.significance}</span>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start space-x-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 mb-5">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            Statistical anomaly detection is retrospective and exploratory. Statistical flags do not
            predict earthquakes or signify an imminent rupture.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <Link
            href={`/earthquakes/${event.eventId}`}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Full Analytical View →
          </Link>

          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono transition-colors"
            >
              <span>USGS Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
