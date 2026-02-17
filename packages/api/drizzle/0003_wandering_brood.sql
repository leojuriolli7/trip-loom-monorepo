DO $$
BEGIN
	CREATE TYPE "public"."amenity" AS ENUM('wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'parking', 'airport-shuttle', 'room-service', 'concierge', 'beach-access', 'pet-friendly', 'business-center', 'kids-club', 'laundry', 'air-conditioning', 'balcony', 'ocean-view', 'city-view');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DROP TRIGGER IF EXISTS "destination_search_vector_trigger" ON "destination";--> statement-breakpoint
DROP TRIGGER IF EXISTS "hotel_search_vector_trigger" ON "hotel";--> statement-breakpoint
ALTER TABLE "destination" ALTER COLUMN "region" SET DATA TYPE "public"."region" USING "region"::"public"."region";--> statement-breakpoint
ALTER TABLE "destination" ALTER COLUMN "highlights" SET DATA TYPE "public"."travel_interest"[] USING "highlights"::"public"."travel_interest"[];--> statement-breakpoint
ALTER TABLE "hotel" ALTER COLUMN "amenities" SET DATA TYPE "public"."amenity"[] USING "amenities"::"public"."amenity"[];--> statement-breakpoint
CREATE OR REPLACE FUNCTION destination_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.region::text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.highlights, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
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
CREATE TRIGGER "destination_search_vector_trigger"
  BEFORE INSERT OR UPDATE OF "name", "country", "region", "description", "highlights"
  ON "destination"
  FOR EACH ROW
  EXECUTE FUNCTION destination_search_vector_update();--> statement-breakpoint
CREATE TRIGGER "hotel_search_vector_trigger"
  BEFORE INSERT OR UPDATE OF "name", "address", "description", "amenities"
  ON "hotel"
  FOR EACH ROW
  EXECUTE FUNCTION hotel_search_vector_update();
