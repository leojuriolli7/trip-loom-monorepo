CREATE INDEX IF NOT EXISTS "destination_search_vector_idx" ON "destination" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hotel_search_vector_idx" ON "hotel" USING gin ("search_vector");
