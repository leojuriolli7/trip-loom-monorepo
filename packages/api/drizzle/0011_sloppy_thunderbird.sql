ALTER TABLE "hotel" DROP CONSTRAINT "hotel_star_rating_check";--> statement-breakpoint
DROP INDEX "hotel_star_rating_idx";--> statement-breakpoint
ALTER TABLE "hotel" DROP COLUMN "star_rating";