"use client";

import React, { useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { formatRelativeTime, formatUTC } from "@/lib/utils";

interface LiveIndicatorProps {
  lastFetchedAt: string;
  latestEventTime?: string;
  source: string;
  onRefresh?: () => Promise<void>;
}

export function LiveIndicator({
  lastFetchedAt,
  latestEventTime,
  source,
  onRefresh,
}: LiveIndicatorProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const fetchDate = new Date(lastFetchedAt);
  const isStale = Date.now() - fetchDate.getTime() > 60 * 60 * 1000; // > 1 hour

  const handleManualRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      await onRefresh();
      setRefreshMessage("Data refreshed from USGS Catalog.");
      setTimeout(() => setRefreshMessage(null), 4000);
    } catch (err: any) {
      setRefreshMessage(`Refresh failed: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm text-xs font-mono">
      <div className="flex flex-wrap items-center gap-3">
        {/* Source Badge */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="font-semibold uppercase">{source}</span>
        </div>

        {/* Freshness Status */}
        <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Synced: {formatRelativeTime(lastFetchedAt)}</span>
          <span className="text-slate-400 dark:text-slate-500">({formatUTC(lastFetchedAt)})</span>
        </div>

        {/* Latest Earthquake timestamp */}
        {latestEventTime && (
          <div className="hidden md:flex items-center space-x-1 text-slate-600 dark:text-slate-400">
            <span>• Latest Event:</span>
            <span className="text-slate-900 dark:text-slate-200 font-semibold">
              {formatRelativeTime(latestEventTime)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Stale Warning Indicator */}
        {isStale && (
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Feed Stale (&gt;1h)</span>
          </div>
        )}

        {/* Manual Refresh Action */}
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          id="manual-refresh-feed-btn"
          aria-label="Refresh seismic data"
          className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-300 dark:border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-sky-500" : ""}`} />
          <span>{refreshing ? "Fetching..." : "Refresh Catalog"}</span>
        </button>
      </div>

      {refreshMessage && (
        <div className="w-full text-right text-[11px] text-sky-600 dark:text-sky-400 animate-in fade-in">
          {refreshMessage}
        </div>
      )}
    </div>
  );
}
