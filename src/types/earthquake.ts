export interface Earthquake {
  eventId: string;
  magnitude: number | null;
  magnitudeType: string | null;
  place: string | null;
  eventTime: string; // ISO 8601 UTC
  eventTimeMs: number; // Unix epoch ms
  depthKm: number | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string | null;
  sourceUpdatedAt: string | null;
  significance?: number | null;
  tsunami?: number | null;
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export interface EarthquakeFilterParams {
  search?: string;
  minMagnitude?: number;
  maxMagnitude?: number;
  minDepth?: number;
  maxDepth?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: "eventTime" | "magnitude" | "depthKm";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedEarthquakes {
  data: Earthquake[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filterApplied: Partial<EarthquakeFilterParams>;
  lastFetchedAt: string;
  source: "DATABASE" | "LIVE_CACHE" | "UPSTREAM_USGS";
}

export interface IngestionRunRecord {
  id: number;
  startedAt: string;
  completedAt: string | null;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  errorSummary: string | null;
}
