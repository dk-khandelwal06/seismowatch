"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Earthquake } from "@/types/earthquake";
import { RotateCcw, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { formatUTC } from "@/lib/utils";

interface LeafletMapClientProps {
  earthquakes: Earthquake[];
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  selectedEventId?: string | null;
}

const DEFAULT_CENTER: [number, number] = [26.5, 84.0]; // Central Himalayan Arc
const DEFAULT_ZOOM = 5;

export default function LeafletMapClient({
  earthquakes,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  height = "520px",
  selectedEventId,
}: LeafletMapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeFilterMag, setActiveFilterMag] = useState<number>(2.0);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains("dark");

    const tileUrl = isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 3,
      maxZoom: 14,
      scrollWheelZoom: true,
    });

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when earthquakes or filter change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const filtered = earthquakes.filter((e) => {
      if (e.latitude === null || e.longitude === null) return false;
      if (e.magnitude !== null && e.magnitude < activeFilterMag) return false;
      return true;
    });

    for (const eq of filtered) {
      const mag = eq.magnitude ?? 3.0;

      // Color and radius based on magnitude
      let color = "#38BDF8"; // Ice blue
      let fillColor = "#38BDF8";
      let radius = 6;
      let fillOpacity = 0.6;

      if (mag >= 6.0) {
        color = "#EF4444"; // Crimson
        fillColor = "#EF4444";
        radius = 16;
        fillOpacity = 0.85;
      } else if (mag >= 5.0) {
        color = "#F59E0B"; // Amber
        fillColor = "#F59E0B";
        radius = 12;
        fillOpacity = 0.75;
      } else if (mag >= 4.0) {
        color = "#38BDF8";
        fillColor = "#38BDF8";
        radius = 8;
        fillOpacity = 0.65;
      } else {
        color = "#10B981"; // Emerald
        fillColor = "#10B981";
        radius = 5;
        fillOpacity = 0.5;
      }

      const isSelected = selectedEventId && selectedEventId === eq.eventId;
      if (isSelected) {
        radius += 4;
        color = "#FFFFFF";
      }

      const marker = L.circleMarker([eq.latitude!, eq.longitude!], {
        radius,
        color,
        weight: isSelected ? 3 : 1.5,
        fillColor,
        fillOpacity,
      });

      // Tooltip for quick hover
      marker.bindTooltip(`<strong>M${mag.toFixed(1)}</strong> — ${eq.place || "Unspecified"}`, {
        direction: "top",
        offset: [0, -radius],
        className: "leaflet-custom-tooltip",
      });

      // Detailed Popup on click
      const popupHtml = `
        <div style="font-family: -apple-system, sans-serif; font-size: 12px; color: #0F172A; max-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 14px; color: ${color};">M${mag.toFixed(1)} ${
        eq.magnitudeType || ""
      }</span>
            <span style="font-family: monospace; font-size: 10px; color: #64748B;">${eq.eventId}</span>
          </div>
          <p style="margin: 0 0 6px 0; font-weight: 600; line-height: 1.3;">${eq.place || "Himalayan Region"}</p>
          <div style="font-family: monospace; font-size: 10px; color: #475569; margin-bottom: 6px;">
            <div>Time: ${formatUTC(eq.eventTime)}</div>
            <div>Depth: ${eq.depthKm !== null ? `${eq.depthKm} km` : "Unknown"}</div>
            <div>Coords: ${eq.latitude?.toFixed(3)}°N, ${eq.longitude?.toFixed(3)}°E</div>
          </div>
          <div style="display: flex; gap: 8px; font-size: 10px; margin-top: 4px;">
            <a href="/earthquakes/${eq.eventId}" style="color: #0284C7; text-decoration: underline; font-weight: 600;">Event Detail →</a>
            ${
              eq.sourceUrl
                ? `<a href="${eq.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #64748B; text-decoration: underline;">USGS Source ↗</a>`
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayer.addLayer(marker);
    }
  }, [earthquakes, activeFilterMag, selectedEventId]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(initialCenter, initialZoom, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
      {/* Map Filter Controls Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-white/90 dark:bg-[#0B101E]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs shadow-md">
        <span className="text-[10px] font-mono font-semibold px-2 text-slate-500 dark:text-slate-400">
          MIN MAG:
        </span>
        {[2.0, 3.0, 4.0, 5.0].map((m) => (
          <button
            key={m}
            onClick={() => setActiveFilterMag(m)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              activeFilterMag === m
                ? "bg-sky-600 text-white font-bold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            M{m}+
          </button>
        ))}

        <button
          onClick={handleResetView}
          title="Reset to Himalayan Bounding Box"
          className="ml-2 flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-3 z-[1000] p-2.5 rounded-lg bg-white/90 dark:bg-[#0B101E]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[11px] font-mono shadow-md">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Magnitude Scale</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 border border-red-500" />
            <span className="text-slate-700 dark:text-slate-300">M6.0+ Major</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400/80 border border-amber-400" />
            <span className="text-slate-700 dark:text-slate-300">M5.0–5.9 Moderate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400/80 border border-sky-400" />
            <span className="text-slate-700 dark:text-slate-300">M4.0–4.9 Light</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400/80 border border-emerald-400" />
            <span className="text-slate-700 dark:text-slate-300">M2.0–3.9 Minor</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: "100%" }} />
    </div>
  );
}
