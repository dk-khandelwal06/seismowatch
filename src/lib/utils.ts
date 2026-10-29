import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format ISO date string into readable UTC timestamp with optional local comparison.
 */
export function formatUTC(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  } catch {
    return "Invalid date";
  }
}

/**
 * Format relative time (e.g. "12m ago", "3h ago", "2d ago").
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "just now";
    const minutes = Math.floor(diffMs / (60 * 1000));
    if (minutes < 1) return "< 1m ago";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "—";
  }
}

/**
 * Returns distinct visual styling for earthquake magnitudes.
 */
export function getMagnitudeBadge(mag: number | null): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (mag === null || isNaN(mag)) {
    return {
      bg: "bg-slate-800/60 dark:bg-slate-800/60",
      text: "text-slate-400",
      border: "border-slate-700",
      label: "Unknown",
    };
  }
  if (mag >= 6.0) {
    return {
      bg: "bg-crimson-alert/20 dark:bg-red-950/40",
      text: "text-red-400 font-bold",
      border: "border-red-500/50 shadow-sm shadow-red-900/30",
      label: "Major (M6+)",
    };
  }
  if (mag >= 5.0) {
    return {
      bg: "bg-amber-500/20 dark:bg-amber-950/40",
      text: "text-amber-400 font-bold",
      border: "border-amber-500/50 shadow-sm shadow-amber-900/20",
      label: "Moderate (M5.0–5.9)",
    };
  }
  if (mag >= 4.0) {
    return {
      bg: "bg-ice-400/20 dark:bg-sky-950/40",
      text: "text-ice-400 font-medium",
      border: "border-ice-400/40",
      label: "Light (M4.0–4.9)",
    };
  }
  return {
    bg: "bg-emerald-500/20 dark:bg-emerald-950/30",
    text: "text-emerald-400 font-medium",
    border: "border-emerald-500/30",
    label: "Minor (M2.0–3.9)",
  };
}
