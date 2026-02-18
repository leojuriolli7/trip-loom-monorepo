CREATE TYPE "public"."hotel_style" AS ENUM('art-deco', 'bay-view', 'boutique', 'budget', 'business', 'centrally-located', 'charming', 'city-view', 'classic', 'family', 'family-resort', 'great-view', 'green', 'harbor-view', 'hidden-gem', 'historic', 'lagoon-view', 'lake-view', 'luxury', 'marina-view', 'mid-range', 'modern', 'mountain-view', 'ocean-view', 'park-view', 'quaint', 'quiet', 'quirky', 'residential', 'river-view', 'romantic', 'trendy', 'value');--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'free-wifi' BEFORE 'pool';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'indoor-pool' BEFORE 'spa';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'outdoor-pool' BEFORE 'spa';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'heated-pool' BEFORE 'spa';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'infinity-pool' BEFORE 'spa';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'rooftop-pool' BEFORE 'spa';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'sauna' BEFORE 'gym';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'steam-room' BEFORE 'gym';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'hot-tub' BEFORE 'gym';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'fitness-center' BEFORE 'restaurant';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'rooftop-bar' BEFORE 'parking';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'coffee-shop' BEFORE 'parking';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'free-parking' BEFORE 'airport-shuttle';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'valet-parking' BEFORE 'airport-shuttle';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'free-airport-transportation' BEFORE 'room-service';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'beachfront' BEFORE 'pet-friendly';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'private-beach' BEFORE 'pet-friendly';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'meeting-rooms' BEFORE 'kids-club';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'conference-facilities' BEFORE 'kids-club';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'kids-pool' BEFORE 'laundry';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'dry-cleaning' BEFORE 'air-conditioning';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'private-balcony' BEFORE 'ocean-view';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'mountain-view';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE '24-hour-front-desk';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE '24-hour-security';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'accessible-rooms';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'wheelchair-access';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'all-inclusive';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'babysitting';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'baggage-storage';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'bathrobes';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'breakfast-included';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'breakfast-buffet';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'casino';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'currency-exchange';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'doorperson';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'electric-vehicle-charging';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'executive-lounge';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'express-check-in';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'family-rooms';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'fireplace';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'gift-shop';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'golf-course';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'hair-dryer';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'housekeeping';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'kitchenette';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'minibar';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'non-smoking-rooms';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'non-smoking-hotel';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'on-demand-movies';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'outdoor-furniture';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'patio';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'private-bathroom';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'refrigerator';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'safe';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'shuttle-service';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'soundproof-rooms';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'suites';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'sun-terrace';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'tennis-court';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'tv';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'flatscreen-tv';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'bicycle-rental';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'diving';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'snorkeling';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'water-sports';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'hiking';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'yoga-classes';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'massage';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'couples-massage';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'poolside-bar';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'snack-bar';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'special-diet-menus';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'telephone';--> statement-breakpoint
ALTER TYPE "public"."amenity" ADD VALUE 'iron';--> statement-breakpoint
ALTER TABLE "hotel" DROP CONSTRAINT "hotel_star_rating_check";--> statement-breakpoint
ALTER TABLE "hotel" DROP CONSTRAINT "hotel_avg_price_non_negative";--> statement-breakpoint
ALTER TABLE "hotel" ALTER COLUMN "star_rating" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel" ALTER COLUMN "amenities" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "hotel" ALTER COLUMN "price_range" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel" ALTER COLUMN "avg_price_per_night_in_cents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "address_obj" jsonb;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "rating" real;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "num_reviews" integer;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "ranking_string" text;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "styles" "hotel_style"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE INDEX "hotel_rating_idx" ON "hotel" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "hotel_styles_idx" ON "hotel" USING gin ("styles");--> statement-breakpoint
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_rating_check" CHECK ("hotel"."rating" IS NULL OR ("hotel"."rating" >= 0 AND "hotel"."rating" <= 5));--> statement-breakpoint
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_star_rating_check" CHECK ("hotel"."star_rating" IS NULL OR ("hotel"."star_rating" >= 1 AND "hotel"."star_rating" <= 5));--> statement-breakpoint
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_avg_price_non_negative" CHECK ("hotel"."avg_price_per_night_in_cents" IS NULL OR "hotel"."avg_price_per_night_in_cents" >= 0);