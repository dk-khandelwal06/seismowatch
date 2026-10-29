"use client";

import React, { useState } from "react";
import { Earthquake } from "@/types/earthquake";
import { formatUTC, formatRelativeTime, getMagnitudeBadge } from "@/lib/utils";
import { ExternalLink, ArrowUpDown, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { EarthquakeDetailModal } from "./EarthquakeDetailModal";

interface EarthquakeTableProps {
  earthquakes: Earthquake[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: "eventTime" | "magnitude" | "depthKm") => void;
  isLoading?: boolean;
}

export function EarthquakeTable({
  earthquakes,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading = false,
}: EarthquakeTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<Earthquake | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="observatory-card p-8 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-500">Querying seismic catalog...</p>
      </div>
    );
  }

  if (earthquakes.length === 0) {
    return (
      <div className="observatory-card p-12 text-center">
        <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No seismic observations match active criteria
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Try expanding the geographic bounding box, reducing the minimum magnitude threshold, or adjusting the date range.
        </p>
      </div>
    );
  }

  return (
    <div className="observatory-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="hairline-b bg-slate-50/80 dark:bg-slate-900/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => onSortChange("magnitude")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Magnitude</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Location / Region</th>
              <th
                onClick={() => onSortChange("eventTime")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Event Time (UTC)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => onSortChange("depthKm")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Focal Depth</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 hidden md:table-cell">Coordinates</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {earthquakes.map((eq) => {
              const badge = getMagnitudeBadge(eq.magnitude);

              return (
                <tr
                  key={eq.eventId}
                  onClick={() => setSelectedEvent(eq)}
                  className="hover:bg-sky-500/5 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Magnitude */}
                  <td className="py-3 px-4 font-mono whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      M{eq.magnitude !== null ? eq.magnitude.toFixed(1) : "—"}
                      {eq.magnitudeType && (
                        <span className="text-[10px] ml-1 opacity-80">{eq.magnitudeType}</span>
                      )}
                    </span>
                  </td>

                  {/* Place */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {eq.place || "Himalayan Belt"}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{eq.eventId}</span>
                  </td>

                  {/* Event Time */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono text-slate-800 dark:text-slate-200">
                      {formatUTC(eq.eventTime)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatRelativeTime(eq.eventTime)}
                    </div>
                  </td>

                  {/* Depth */}
                  <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {eq.depthKm !== null ? `${eq.depthKm.toFixed(1)} km` : "—"}
                  </td>

                  {/* Coordinates */}
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:table-cell text-[11px]">
                    {eq.latitude !== null && eq.longitude !== null
                      ? `${eq.latitude.toFixed(2)}°N, ${eq.longitude.toFixed(2)}°E`
                      : "—"}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedEvent(eq)}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono transition-colors"
                      >
                        Details
                      </button>
                      {eq.sourceUrl && (
                        <a
                          href={eq.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open USGS official catalog page"
                          className="p-1 rounded text-slate-400 hover:text-sky-500 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="hairline-t px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
        <div>
          Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of{" "}
          <strong className="text-slate-900 dark:text-slate-200">{totalCount.toLocaleString()}</strong> events
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EarthquakeDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
