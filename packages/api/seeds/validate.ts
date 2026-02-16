import { z } from "zod";

// Standardized highlight tags
export const HIGHLIGHT_TAGS = [
  "beaches",
  "culture",
  "food",
  "nightlife",
  "adventure",
  "history",
  "nature",
  "shopping",
  "relaxation",
  "architecture",
  "wildlife",
  "mountains",
  "islands",
  "temples",
  "art",
  "wine",
  "skiing",
  "diving",
  "hiking",
  "photography",
] as const;

// Standardized amenities
export const AMENITIES = [
  "wifi",
  "pool",
  "spa",
  "gym",
  "restaurant",
  "bar",
  "parking",
  "airport-shuttle",
  "room-service",
  "concierge",
  "beach-access",
  "pet-friendly",
  "business-center",
  "kids-club",
  "laundry",
  "air-conditioning",
  "balcony",
  "ocean-view",
  "city-view",
] as const;

export const priceRangeSchema = z.enum([
  "budget",
  "moderate",
  "upscale",
  "luxury",
]);

export const destinationSeedSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  region: z.string().min(1),
  timezone: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  description: z.string().min(1),
  highlights: z.array(z.enum(HIGHLIGHT_TAGS)).min(1),
  bestTimeToVisit: z.string().nullable(),
});

export const hotelSeedSchema = z.object({
  id: z.string().min(1),
  destinationId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().url().nullable(),
  starRating: z.number().int().min(1).max(5),
  amenities: z.array(z.enum(AMENITIES)).min(1),
  priceRange: priceRangeSchema,
  avgPricePerNightInCents: z.number().int().positive(),
  description: z.string().min(1),
});

export const seedDataSchema = z.object({
  destinations: z.array(destinationSeedSchema),
  hotels: z.array(hotelSeedSchema),
});

export type DestinationSeed = z.infer<typeof destinationSeedSchema>;
export type HotelSeed = z.infer<typeof hotelSeedSchema>;
export type SeedData = z.infer<typeof seedDataSchema>;
