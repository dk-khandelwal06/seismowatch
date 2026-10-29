"use client";

import React, { useEffect, useState } from "react";
import { Earthquake } from "@/types/earthquake";
import { EarthquakeMap } from "@/components/maps/EarthquakeMap";
import { LiveIndicator } from "@/components/observatory/LiveIndicator";
import { MapPin, Filter, Layers, Info } from "lucide-react";

export default function InteractiveMapPage() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>(new Date().toISOString());
  const [dataSource, setDataSource] = useState<string>("UPSTREAM_USGS");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [minMag, setMinMag] = useState<number>(2.0);

  const loadMapData = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      if (forceRefresh) {
        await fetch("/api/ingestion/refresh", { method: "POST" });
      }
      const res = await fetch("/api/earthquakes?limit=250");
      if (res.ok) {
        const payload = await res.json();
        setEarthquakes(payload.data || []);
        setLastFetchedAt(payload.lastFetchedAt || new Date().toISOString());
        setDataSource(payload.source || "UPSTREAM_USGS");
      }
    } catch (err) {
      console.error("Map data fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const filtered = earthquakes.filter((e) => e.magnitude === null || e.magnitude >= minMag);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-500 text-xs font-mono uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Geospatial Observatory • Leaflet Cartography</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Interactive Earthquake Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Tectonic distribution across the Indian Plate collision zone and Himalayan arc.
            Circles are scaled and color-graded by moment magnitude.
          </p>
        </div>

        {/* Quick Min Magnitude Filter */}
        <div className="flex items-center space-x-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono">
          <span className="text-slate-400 text-[11px] px-1">THRESHOLD:</span>
          {[2.0, 3.5, 4.5, 5.5].map((m) => (
            <button
              key={m}
              onClick={() => setMinMag(m)}
              className={`px-2 py-1 rounded transition-colors ${
                minMag === m
                  ? "bg-sky-600 text-white font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              M{m}+
            </button>
          ))}
        </div>
      </div>

      <LiveIndicator
        lastFetchedAt={lastFetchedAt}
        latestEventTime={earthquakes[0]?.eventTime}
        source={dataSource}
        onRefresh={() => loadMapData(true)}
      />

      {/* Map Display */}
      <div className="space-y-2">
        <EarthquakeMap earthquakes={filtered} height="680px" />
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono px-1">
          <span>Active Bounding Box: 6.0°N to 38.0°N, 68.0°E to 98.0°E</span>
          <span>Displaying {filtered.length} of {earthquakes.length} cached seismic epicenters</span>
        </div>
      </div>
    </div>
  );
}
