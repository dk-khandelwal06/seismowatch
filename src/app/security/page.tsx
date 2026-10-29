"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Server,
  Key,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
} from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  responseTimeMs: number;
  upstream: {
    provider: string;
    api: string;
    status: string;
    latencyMs: number;
    error: string | null;
  };
  persistence: {
    type: string;
    status: "PASSED" | "FAILED" | "BLOCKED";
    configured: boolean;
    connected: boolean;
    message: string;
    totalStoredRecords: number;
    lastIngestionRun: any | null;
  };
  version: string;
}

export default function SecurityPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-sky-500 text-xs font-mono uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Infrastructure Integrity & Privacy Disclosures</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Security, Privacy & System Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Operational telemetry, database persistence status, secret isolation policies, and privacy guarantees.
        </p>
      </div>

      {/* Live System Health Diagnostic Panel */}
      <div className="observatory-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Live System Status & Endpoint Health
            </h2>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-sky-500" : ""}`} />
            <span>Poll Health</span>
          </button>
        </div>

        {health ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {/* 1. Overall Gateway Status */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Gateway API</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-900 dark:text-white">{health.status}</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Latency: {health.responseTimeMs}ms • v{health.version}
              </span>
            </div>

            {/* 2. USGS Upstream Reachability */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">USGS Upstream</span>
              <div className="flex items-center space-x-1.5 mt-1">
                {health.upstream.status === "PASSED" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-bold text-slate-900 dark:text-white">{health.upstream.status}</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                HTTP Latency: {health.upstream.latencyMs}ms
              </span>
            </div>

            {/* 3. Database Persistence Status */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">PostgreSQL Persistence</span>
              <div className="flex items-center space-x-1.5 mt-1">
                {health.persistence.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-500 font-bold">
                    {health.persistence.status}
                  </span>
                )}
                <span className="font-bold text-slate-900 dark:text-white">
                  {health.persistence.connected ? "CONNECTED" : "UNCONFIGURED"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Stored records: {health.persistence.totalStoredRecords}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs font-mono text-slate-400">Loading system status...</div>
        )}

        {health && !health.persistence.connected && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-900 dark:text-amber-300">
            <strong>Persistence Status:</strong> {health.persistence.message}
          </div>
        )}
      </div>

      {/* Architectural Security Controls */}
      <div className="observatory-card p-6 space-y-4">
        <div className="flex items-center space-x-2 text-sky-500">
          <Lock className="w-4 h-4" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Architecture & Secret Isolation Policy
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            SeismoWatch enforces strict separation between server-side execution and client delivery:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Zero Client Credential Exposure:</strong> Database connection strings (<code>DATABASE_URL</code>)
              and mutation secrets (<code>INGESTION_SECRET_TOKEN</code>) are restricted strictly to server-side environments.
              No secrets are ever prefixed with <code>NEXT_PUBLIC_</code> or included in client JavaScript bundles.
            </li>
            <li>
              <strong>SQL Injection Prevention:</strong> All database queries use parameterized execution and typed AST
              representations via Drizzle ORM. Raw string concatenation in SQL queries is completely prohibited.
            </li>
            <li>
              <strong>Mutation Endpoint Protection:</strong> The <code>POST /api/ingestion/refresh</code> endpoint is
              protected with both server-side token validation and a minimum 30-second cooldown rate limiter to prevent
              denial-of-service hammering against upstream USGS infrastructure.
            </li>
            <li>
              <strong>Upstream SSRF Defense:</strong> Upstream catalog fetching is hardcoded to the official USGS API
              endpoint. No client-supplied URLs can trigger server-side HTTP requests.
            </li>
          </ul>
        </div>
      </div>

      {/* Privacy Policy Guarantee */}
      <div className="observatory-card p-6 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-500">
          <EyeOff className="w-4 h-4" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Privacy Policy & Zero Personal Data Guarantee
          </h2>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            SeismoWatch is an open scientific monitoring platform. We uphold absolute privacy principles:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>No User Account or Authentication:</strong> The observatory is publicly accessible without user sign-in.</li>
            <li><strong>Zero Tracking or Cookies:</strong> We do not set tracking cookies, analytics pixels, or commercial telemetry beacons.</li>
            <li><strong>Zero Personal Identifiable Information (PII):</strong> No names, email addresses, IP addresses, or device IDs are retained in database storage.</li>
            <li><strong>Pure Geological Data:</strong> The database stores solely geodetic earthquake parameters released into the public domain by USGS.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
