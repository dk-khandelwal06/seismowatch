import {
  pgTable,
  varchar,
  text,
  doublePrecision,
  timestamp,
  serial,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const earthquakes = pgTable(
  "earthquakes",
  {
    eventId: varchar("event_id", { length: 128 }).primaryKey(),
    magnitude: doublePrecision("magnitude"),
    magnitudeType: varchar("magnitude_type", { length: 32 }),
    place: text("place"),
    eventTime: timestamp("event_time", { withTimezone: true }).notNull(),
    depthKm: doublePrecision("depth_km"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    sourceUrl: text("source_url"),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idxEventTime: index("idx_earthquakes_event_time").on(table.eventTime),
    idxMagnitude: index("idx_earthquakes_magnitude").on(table.magnitude),
    idxGeo: index("idx_earthquakes_geo").on(table.latitude, table.longitude),
  })
);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: varchar("status", { length: 32 }).notNull(), // 'SUCCESS' | 'FAILED' | 'RUNNING'
  recordsReceived: integer("records_received").default(0).notNull(),
  recordsInserted: integer("records_inserted").default(0).notNull(),
  recordsUpdated: integer("records_updated").default(0).notNull(),
  errorSummary: text("error_summary"),
});

export const analysisRuns = pgTable("analysis_runs", {
  id: serial("id").primaryKey(),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).defaultNow().notNull(),
  windowSize: integer("window_size").notNull(),
  threshold: doublePrecision("threshold").notNull(),
  totalAnalyzed: integer("total_analyzed").notNull(),
  anomaliesDetected: integer("anomalies_detected").notNull(),
  metadataJson: text("metadata_json"),
});
