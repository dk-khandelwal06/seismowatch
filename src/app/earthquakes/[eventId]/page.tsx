"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Earthquake } from "@/types/earthquake";
import { getMagnitudeBadge, formatUTC, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  MapPin,
  Clock,
  Layers,
  Compass,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { EarthquakeMap } from "@/components/maps/EarthquakeMap";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Earthquake | null>(null);
  const [statisticalContext, setStatisticalContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/earthquakes/${eventId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Earthquake observation '${eventId}' could not be resolved in the USGS catalog.`);
          }
          throw new Error(`Catalog query failed with status ${res.status}`);
        }
        const payload = await res.json();
        setEvent(payload.data);
        setStatisticalContext(payload.statisticalContext);
      } catch (err: any) {
        setError(err.message || "Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Resolving event {eventId}...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-16 observatory-card p-8 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Event Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || "Observation could not be found."}</p>
        <Link
          href="/earthquakes"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Live Catalog</span>
        </Link>
      </div>
    );
  }

  const badge = getMagnitudeBadge(event.magnitude);

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-sky-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Observations</span>
      </button>

      {/* Main Event Card */}
      <div className="observatory-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 hairline-b pb-6">
          <div className="flex items-start space-x-4">
            <div
              className={`px-4 py-2.5 rounded-2xl border text-3xl font-mono font-bold ${badge.bg} ${badge.text} ${badge.border}`}
            >
              M{event.magnitude !== null ? event.magnitude.toFixed(1) : "—"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-sky-500 uppercase tracking-widest">
                  USGS Event ID: {event.eventId}
                </span>
                {event.magnitudeType && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                    Scale: {event.magnitudeType}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {event.place || "Unspecified Himalayan Region"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Observed {formatRelativeTime(event.eventTime)}
              </p>
            </div>
          </div>

          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>USGS Source Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
        </div>

        {/* Grid of Geodetic Properties */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Event Timestamp
            </span>
            <p className="text-xs font-mono font-semibold text-slate-900 dark:text-white mt-1">
              {formatUTC(event.eventTime)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Focal Depth
            </span>
            <p className="text-xs font-mono font-semibold text-slate-900 dark:text-white mt-1">
              {event.depthKm !== null ? `${event.depthKm} km` : "Unspecified"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Coordinates
            </span>
            <p className="text-xs font-mono font-semibold text-slate-900 dark:text-white mt-1">
              {event.latitude?.toFixed(3)}°N, {event.longitude?.toFixed(3)}°E
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Significance Index
            </span>
            <p className="text-xs font-mono font-semibold text-slate-900 dark:text-white mt-1">
              {event.significance ?? "Standard (0)"}
            </p>
          </div>
        </div>

        {/* Statistical Anomaly Evaluation Box */}
        {statisticalContext && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Prospective Statistical Baseline Evaluation
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  statisticalContext.isAnomaly
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                    : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                }`}
              >
                {statisticalContext.isAnomaly ? "OUTLIER" : "NORMAL"}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {statisticalContext.explanation}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
              <div>Baseline Mean: M{statisticalContext.baselineMean ?? "N/A"}</div>
              <div>Std Dev: ±{statisticalContext.baselineStdDev ?? "N/A"}</div>
              <div>
                Z-Score:{" "}
                {statisticalContext.zScore !== null
                  ? `${statisticalContext.zScore > 0 ? "+" : ""}${statisticalContext.zScore}σ`
                  : "N/A"}
              </div>
            </div>
          </div>
        )}

        {/* Epicenter Map Location */}
        {event.latitude !== null && event.longitude !== null && (
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>Epicenter Location</span>
            </h3>
            <EarthquakeMap
              earthquakes={[event]}
              initialCenter={[event.latitude, event.longitude]}
              initialZoom={7}
              height="340px"
              selectedEventId={event.eventId}
            />
          </div>
        )}

        {/* Non-Predictive Scientific Disclaimer */}
        <div className="flex items-start space-x-2 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Scientific Notice:</strong> Statistical flags are retrospective indicators of mathematical variation
            relative to recent prior observations. Statistical anomalies do NOT forecast future earthquake occurrences,
            magnitude escalation, or fault rupture.
          </p>
        </div>
      </div>
    </div>
  );
}
