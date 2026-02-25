CREATE TYPE "public"."hotel_room_type" AS ENUM('standard', 'deluxe', 'suite', 'junior-suite', 'double', 'twin', 'single', 'king', 'queen', 'family', 'penthouse', 'villa');--> statement-breakpoint
ALTER TABLE "hotel_booking" ALTER COLUMN "room_type" SET DATA TYPE "public"."hotel_room_type" USING (
  CASE lower(trim("room_type"))
    WHEN 'standard' THEN 'standard'
    WHEN 'standard room' THEN 'standard'
    WHEN 'deluxe' THEN 'deluxe'
    WHEN 'deluxe room' THEN 'deluxe'
    WHEN 'suite' THEN 'suite'
    WHEN 'junior suite' THEN 'junior-suite'
    WHEN 'junior-suite' THEN 'junior-suite'
    WHEN 'double' THEN 'double'
    WHEN 'double room' THEN 'double'
    WHEN 'twin' THEN 'twin'
    WHEN 'twin room' THEN 'twin'
    WHEN 'single' THEN 'single'
    WHEN 'single room' THEN 'single'
    WHEN 'king' THEN 'king'
    WHEN 'king room' THEN 'king'
    WHEN 'queen' THEN 'queen'
    WHEN 'queen room' THEN 'queen'
    WHEN 'family' THEN 'family'
    WHEN 'family room' THEN 'family'
    WHEN 'penthouse' THEN 'penthouse'
    WHEN 'villa' THEN 'villa'
    ELSE 'standard'
  END
)::"public"."hotel_room_type";--> statement-breakpoint
ALTER TABLE "hotel" ADD COLUMN "room_types" "hotel_room_type"[] DEFAULT '{}' NOT NULL;
