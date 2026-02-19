DROP INDEX "trip_status_idx";--> statement-breakpoint
DROP INDEX "trip_user_id_status_idx";--> statement-breakpoint
ALTER TABLE "trip" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
CREATE INDEX "trip_cancelled_at_idx" ON "trip" USING btree ("cancelled_at");--> statement-breakpoint
ALTER TABLE "trip" DROP COLUMN "status";