ALTER TABLE "destination" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "destination" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "source_id" text;--> statement-breakpoint
CREATE INDEX "destination_coordinates_idx" ON "destination" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "hotel_source_idx" ON "hotel" USING btree ("source");--> statement-breakpoint
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_source_source_id_unique" UNIQUE("source","source_id");