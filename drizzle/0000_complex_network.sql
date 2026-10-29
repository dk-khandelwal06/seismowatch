CREATE TABLE IF NOT EXISTS "analysis_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"window_size" integer NOT NULL,
	"threshold" double precision NOT NULL,
	"total_analyzed" integer NOT NULL,
	"anomalies_detected" integer NOT NULL,
	"metadata_json" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "earthquakes" (
	"event_id" varchar(128) PRIMARY KEY NOT NULL,
	"magnitude" double precision,
	"magnitude_type" varchar(32),
	"place" text,
	"event_time" timestamp with time zone NOT NULL,
	"depth_km" double precision,
	"latitude" double precision,
	"longitude" double precision,
	"source_url" text,
	"source_updated_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingestion_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" varchar(32) NOT NULL,
	"records_received" integer DEFAULT 0 NOT NULL,
	"records_inserted" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"error_summary" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_earthquakes_event_time" ON "earthquakes" USING btree ("event_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_earthquakes_magnitude" ON "earthquakes" USING btree ("magnitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_earthquakes_geo" ON "earthquakes" USING btree ("latitude","longitude");