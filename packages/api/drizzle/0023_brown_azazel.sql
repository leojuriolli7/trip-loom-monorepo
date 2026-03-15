ALTER TABLE "trip" ADD COLUMN "share_token" varchar(32);--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_share_token_unique" UNIQUE("share_token");