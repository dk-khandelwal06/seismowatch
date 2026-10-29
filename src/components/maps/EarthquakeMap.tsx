"use client";

import dynamic from "next/dynamic";
import { Earthquake } from "@/types/earthquake";
import { MapPin } from "lucide-react";

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  selectedEventId?: string | null;
}

const LeafletMapClient = dynamic(() => import("./LeafletMapClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "520px" }}
      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-2 animate-pulse text-slate-400"
    >
      <MapPin className="w-8 h-8 text-sky-500 animate-bounce" />
      <p className="text-xs font-mono">Loading Himalayan Geospatial Cartography...</p>
    </div>
  ),
});

export function EarthquakeMap(props: EarthquakeMapProps) {
  return <LeafletMapClient {...props} />;
}
