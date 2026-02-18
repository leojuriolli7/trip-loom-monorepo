CREATE INDEX "flight_booking_payment_id_idx" ON "flight_booking" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "hotel_booking_hotel_id_idx" ON "hotel_booking" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "hotel_booking_payment_id_idx" ON "hotel_booking" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "trip_user_id_status_idx" ON "trip" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "trip_user_id_created_at_idx" ON "trip" USING btree ("user_id","created_at");