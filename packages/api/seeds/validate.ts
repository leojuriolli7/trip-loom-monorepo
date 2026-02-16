import { z } from "zod";
import {
  amenityEnum,
  priceRangeEnum,
  regionEnum,
  travelInterestEnum,
} from "../src/db/schema";

// Enum values derived from DB schema
const highlightValues = travelInterestEnum.enumValues;
const amenityValues = amenityEnum.enumValues;
const priceRangeValues = priceRangeEnum.enumValues;
const regionValues = regionEnum.enumValues;

const priceRangeSchema = z.enum(priceRangeValues);

const destinationSeedSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  region: z.enum(regionValues),
  timezone: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  description: z.string().min(1),
  highlights: z.array(z.enum(highlightValues)).min(1),
  bestTimeToVisit: z.string().nullable(),
});

const hotelSeedSchema = z.object({
  id: z.string().min(1),
  destinationId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().url().nullable(),
  starRating: z.number().int().min(1).max(5),
  amenities: z.array(z.enum(amenityValues)).min(1),
  priceRange: priceRangeSchema,
  avgPricePerNightInCents: z.number().int().positive(),
  description: z.string().min(1),
});

export const seedDataSchema = z.object({
  destinations: z.array(destinationSeedSchema),
  hotels: z.array(hotelSeedSchema),
});
