CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cabin_class" AS ENUM('economy', 'business', 'first');--> statement-breakpoint
CREATE TYPE "public"."flight_type" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."price_range" AS ENUM('budget', 'moderate', 'upscale', 'luxury');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'upcoming', 'current', 'past', 'cancelled');--> statement-breakpoint
CREATE TABLE "destination" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"country_code" text NOT NULL,
	"region" text,
	"timezone" text NOT NULL,
	"image_url" text,
	"description" text,
	"highlights" text[],
	"best_time_to_visit" text,
	"search_vector" "tsvector",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_booking" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"payment_id" text,
	"type" "flight_type" NOT NULL,
	"flight_number" text NOT NULL,
	"airline" text NOT NULL,
	"departure_airport_code" text NOT NULL,
	"departure_city" text NOT NULL,
	"departure_time" timestamp with time zone NOT NULL,
	"arrival_airport_code" text NOT NULL,
	"arrival_city" text NOT NULL,
	"arrival_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"seat_number" text,
	"cabin_class" "cabin_class" NOT NULL,
	"price_in_cents" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flight_booking_price_non_negative" CHECK ("flight_booking"."price_in_cents" >= 0),
	CONSTRAINT "flight_booking_duration_positive" CHECK ("flight_booking"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "hotel" (
	"id" text PRIMARY KEY NOT NULL,
	"destination_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" real,
	"longitude" real,
	"image_url" text,
	"star_rating" integer NOT NULL,
	"amenities" text[] NOT NULL,
	"price_range" "price_range" NOT NULL,
	"avg_price_per_night_in_cents" integer NOT NULL,
	"description" text,
	"search_vector" "tsvector",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_star_rating_check" CHECK ("hotel"."star_rating" >= 1 AND "hotel"."star_rating" <= 5),
	CONSTRAINT "hotel_avg_price_non_negative" CHECK ("hotel"."avg_price_per_night_in_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hotel_booking" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"hotel_id" text NOT NULL,
	"payment_id" text,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"room_type" text NOT NULL,
	"number_of_nights" integer NOT NULL,
	"price_per_night_in_cents" integer NOT NULL,
	"total_price_in_cents" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_booking_dates_check" CHECK ("hotel_booking"."check_out_date" > "hotel_booking"."check_in_date"),
	CONSTRAINT "hotel_booking_nights_positive" CHECK ("hotel_booking"."number_of_nights" > 0),
	CONSTRAINT "hotel_booking_price_per_night_non_negative" CHECK ("hotel_booking"."price_per_night_in_cents" >= 0),
	CONSTRAINT "hotel_booking_total_price_non_negative" CHECK ("hotel_booking"."total_price_in_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "itinerary" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "itinerary_trip_id_unique" UNIQUE("trip_id")
);
--> statement-breakpoint
CREATE TABLE "itinerary_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_day_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" text,
	"end_time" text,
	"location" text,
	"location_url" text,
	"estimated_cost_in_cents" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "itinerary_activity_order_unique" UNIQUE("itinerary_day_id","order_index"),
	CONSTRAINT "itinerary_activity_order_non_negative" CHECK ("itinerary_activity"."order_index" >= 0),
	CONSTRAINT "itinerary_activity_cost_non_negative" CHECK ("itinerary_activity"."estimated_cost_in_cents" IS NULL OR "itinerary_activity"."estimated_cost_in_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "itinerary_day" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" text NOT NULL,
	"day_number" integer NOT NULL,
	"date" date NOT NULL,
	"title" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "itinerary_day_unique" UNIQUE("itinerary_id","day_number"),
	CONSTRAINT "itinerary_day_number_positive" CHECK ("itinerary_day"."day_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"stripe_customer_id" text,
	"amount_in_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"refunded_amount_in_cents" integer DEFAULT 0 NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payment_amount_non_negative" CHECK ("payment"."amount_in_cents" >= 0),
	CONSTRAINT "payment_refunded_amount_non_negative" CHECK ("payment"."refunded_amount_in_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"payload" text
);
--> statement-breakpoint
CREATE TABLE "trip" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"destination_id" text,
	"title" text,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trip_dates_check" CHECK ("trip"."end_date" IS NULL OR "trip"."start_date" IS NULL OR "trip"."start_date" <= "trip"."end_date")
);
--> statement-breakpoint
CREATE TABLE "user_preference" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"preferred_cabin_class" "cabin_class",
	"budget_range" "price_range",
	"travel_interests" text[] DEFAULT '{}' NOT NULL,
	"preferred_regions" text[] DEFAULT '{}' NOT NULL,
	"dietary_restrictions" text[] DEFAULT '{}' NOT NULL,
	"accessibility_needs" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preference_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "flight_booking" ADD CONSTRAINT "flight_booking_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_booking" ADD CONSTRAINT "flight_booking_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_destination_id_destination_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destination"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_booking" ADD CONSTRAINT "hotel_booking_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_booking" ADD CONSTRAINT "hotel_booking_hotel_id_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_booking" ADD CONSTRAINT "hotel_booking_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_activity" ADD CONSTRAINT "itinerary_activity_itinerary_day_id_itinerary_day_id_fk" FOREIGN KEY ("itinerary_day_id") REFERENCES "public"."itinerary_day"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_day" ADD CONSTRAINT "itinerary_day_itinerary_id_itinerary_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itinerary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_destination_id_destination_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destination"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "destination_country_code_idx" ON "destination" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "destination_region_idx" ON "destination" USING btree ("region");--> statement-breakpoint
CREATE INDEX "flight_booking_trip_id_idx" ON "flight_booking" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "hotel_destination_id_idx" ON "hotel" USING btree ("destination_id");--> statement-breakpoint
CREATE INDEX "hotel_price_range_idx" ON "hotel" USING btree ("price_range");--> statement-breakpoint
CREATE INDEX "hotel_star_rating_idx" ON "hotel" USING btree ("star_rating");--> statement-breakpoint
CREATE INDEX "hotel_booking_trip_id_idx" ON "hotel_booking" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "itinerary_activity_day_id_idx" ON "itinerary_activity" USING btree ("itinerary_day_id");--> statement-breakpoint
CREATE INDEX "itinerary_day_itinerary_id_idx" ON "itinerary_day" USING btree ("itinerary_id");--> statement-breakpoint
CREATE INDEX "payment_trip_id_idx" ON "payment" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_user_id_idx" ON "trip" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_status_idx" ON "trip" USING btree ("status");--> statement-breakpoint

-- =============================================================================
-- GIN Indexes for Full-Text Search
-- =============================================================================
CREATE INDEX "destination_search_vector_idx" ON "destination" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "hotel_search_vector_idx" ON "hotel" USING gin ("search_vector");--> statement-breakpoint

-- =============================================================================
-- Triggers for maintaining tsvector columns
-- =============================================================================

-- Destination search vector trigger function
CREATE OR REPLACE FUNCTION destination_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.region, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.highlights, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER destination_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, country, region, description, highlights
  ON destination
  FOR EACH ROW
  EXECUTE FUNCTION destination_search_vector_update();--> statement-breakpoint

-- Hotel search vector trigger function
CREATE OR REPLACE FUNCTION hotel_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.amenities, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER hotel_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, address, description, amenities
  ON hotel
  FOR EACH ROW
  EXECUTE FUNCTION hotel_search_vector_update();