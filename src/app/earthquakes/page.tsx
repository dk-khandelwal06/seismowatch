"use client";

import React, { useEffect, useState } from "react";
import { Earthquake, EarthquakeFilterParams } from "@/types/earthquake";
import { EarthquakeTable } from "@/components/earthquakes/EarthquakeTable";
import { EarthquakeFilterBar } from "@/components/earthquakes/EarthquakeFilterBar";
import { LiveIndicator } from "@/components/observatory/LiveIndicator";
import { Layers, ShieldAlert } from "lucide-react";

export default function LiveEarthquakesPage() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minMagnitude, setMinMagnitude] = useState<number>(2.0);
  const [sortBy, setSortBy] = useState<"eventTime" | "magnitude" | "depthKm">("eventTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [lastFetchedAt, setLastFetchedAt] = useState<string>(new Date().toISOString());
  const [dataSource, setDataSource] = useState<string>("UPSTREAM_USGS");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      if (forceRefresh) {
        await fetch("/api/ingestion/refresh", { method: "POST" });
      }

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        minMagnitude: String(minMagnitude),
        sortBy,
        sortOrder,
      });

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/earthquakes?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load earthquake observations: HTTP ${res.status}`);
      }

      const payload = await res.json();
      setEarthquakes(payload.data || []);
      setTotalCount(payload.total || 0);
      setLastFetchedAt(payload.lastFetchedAt || new Date().toISOString());
      setDataSource(payload.source || "UPSTREAM_USGS");
    } catch (err: any) {
      console.error("Error loading live earthquake feed:", err);
      setError(err.message || "Failed to query catalog");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [currentPage, minMagnitude, sortBy, sortOrder]);

  // Handle Search submit or debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCatalog();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setMinMagnitude(2.0);
    setSortBy("eventTime");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-500 text-xs font-mono uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>USGS Earthquakes Feed • Regional Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Live Earthquake Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time seismic events registered by the USGS Earthquake Hazards Program across the
            Indian Subcontinent and Himalayan arc (6–38°N, 68–98°E).
          </p>
        </div>
      </div>

      {/* Live Freshness & Refresh Bar */}
      <LiveIndicator
        lastFetchedAt={lastFetchedAt}
        latestEventTime={earthquakes[0]?.eventTime}
        source={dataSource}
        onRefresh={() => fetchCatalog(true)}
      />

      {/* Catalog Coverage Disclaimer */}
      <div className="flex items-start space-x-2 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-900 dark:text-sky-300">
        <ShieldAlert className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <p>
          <strong>Coverage Note:</strong> Global networks like USGS primarily detect regional tremors
          at or above M2.5–3.0. Micro-tremors below M2.0 in remote mountain valleys may not be registered
          by global teleseismic sensors.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <EarthquakeFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        minMagnitude={minMagnitude}
        onMinMagnitudeChange={setMinMagnitude}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onReset={handleResetFilters}
        earthquakesToExport={earthquakes}
      />

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Main Table */}
      <EarthquakeTable
        earthquakes={earthquakes}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(col) => {
          if (sortBy === col) {
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
          } else {
            setSortBy(col);
            setSortOrder("desc");
          }
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
