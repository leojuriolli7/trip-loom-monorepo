CREATE TABLE "airport" (
	"code" text PRIMARY KEY NOT NULL,
	"icao" text,
	"name" text NOT NULL,
	"city" text,
	"country_code" text NOT NULL,
	"continent" text,
	"timezone" text NOT NULL,
	"latitude" real,
	"longitude" real,
	"elevation_ft" integer,
	"airport_type" text,
	"scheduled_service" boolean DEFAULT false NOT NULL,
	"runway_length" integer,
	"wikipedia" text,
	"website" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "airport_country_code_idx" ON "airport" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "airport_continent_idx" ON "airport" USING btree ("continent");--> statement-breakpoint
CREATE INDEX "airport_timezone_idx" ON "airport" USING btree ("timezone");