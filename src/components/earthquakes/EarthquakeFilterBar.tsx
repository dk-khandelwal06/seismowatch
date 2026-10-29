"use client";

import React from "react";
import { Search, Download, RotateCcw, Filter } from "lucide-react";
import { Earthquake } from "@/types/earthquake";

interface EarthquakeFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  minMagnitude: number;
  onMinMagnitudeChange: (mag: number) => void;
  sortBy: string;
  onSortChange: (sort: "eventTime" | "magnitude" | "depthKm") => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  onReset: () => void;
  earthquakesToExport: Earthquake[];
}

export function EarthquakeFilterBar({
  searchQuery,
  onSearchChange,
  minMagnitude,
  onMinMagnitudeChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  onReset,
  earthquakesToExport,
}: EarthquakeFilterBarProps) {
  // Export CSV function
  const handleExportCSV = () => {
    if (earthquakesToExport.length === 0) return;

    const headers = [
      "Event ID",
      "Magnitude",
      "Mag Type",
      "Place",
      "Event Time (UTC)",
      "Depth (km)",
      "Latitude",
      "Longitude",
      "Source URL",
    ];

    const rows = earthquakesToExport.map((e) => [
      `"${e.eventId}"`,
      e.magnitude ?? "",
      `"${e.magnitudeType || ""}"`,
      `"${(e.place || "").replace(/"/g, '""')}"`,
      `"${e.eventTime}"`,
      e.depthKm ?? "",
      e.latitude ?? "",
      e.longitude ?? "",
      `"${e.sourceUrl || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `seismowatch_himalaya_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="observatory-card p-4 space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search location or event ID (e.g. Kathmandu, Hindukush, us7000...)"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Min Magnitude Selector */}
          <div className="flex items-center space-x-1 text-xs font-mono">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Min:</span>
            <select
              value={minMagnitude}
              onChange={(e) => onMinMagnitudeChange(parseFloat(e.target.value))}
              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="2.0">M2.0+ (All Regional)</option>
              <option value="3.0">M3.0+ (Felt)</option>
              <option value="4.0">M4.0+ (Light)</option>
              <option value="5.0">M5.0+ (Moderate)</option>
              <option value="6.0">M6.0+ (Major)</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center space-x-1 text-xs font-mono">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="eventTime">Sort: Time</option>
              <option value="magnitude">Sort: Magnitude</option>
              <option value="depthKm">Sort: Depth</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => onSortOrderChange(sortOrder === "desc" ? "asc" : "desc")}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Export filtered records to CSV"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            title="Reset filters to defaults"
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
