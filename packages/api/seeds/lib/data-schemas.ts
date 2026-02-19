import { z } from "zod";
import {
  amenityEnum,
  hotelStyleEnum,
  priceRangeEnum,
  regionEnum,
  travelInterestEnum,
} from "../../src/db/schema";
import { airportsSeedSchema } from "./airport-normalizer";

const highlightValues = travelInterestEnum.enumValues;
const amenityValues = amenityEnum.enumValues;
const hotelStyleValues = hotelStyleEnum.enumValues;
const priceRangeValues = priceRangeEnum.enumValues;
const regionValues = regionEnum.enumValues;

export const destinationSeedSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  region: z.enum(regionValues).nullable(),
  timezone: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().url().nullable(),
  description: z.string().min(1),
  highlights: z.array(z.enum(highlightValues)).min(1),
  bestTimeToVisit: z.string().nullable(),
});

// Address object schema (from TripAdvisor)
const addressObjSchema = z.object({
  street1: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalcode: z.string().optional(),
}).nullable();

export const hotelSeedSchema = z.object({
  id: z.string().min(1),
  destinationId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  addressObj: addressObjSchema.optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().url().nullable(),
  source: z.string().min(1).nullable().default(null),
  sourceId: z.string().min(1).nullable().default(null),
  sourceUrl: z.string().url().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  numReviews: z.number().int().min(0).nullable().optional(),
  rankingString: z.string().nullable().optional(),
  amenities: z.array(z.enum(amenityValues)),
  styles: z.array(z.enum(hotelStyleValues)).optional().default([]),
  priceRange: z.enum(priceRangeValues).nullable(),
  avgPricePerNightInCents: z.number().int().positive().nullable(),
  description: z.string().nullable(),
});

export const seedDataSchema = z.object({
  airports: airportsSeedSchema.default([]),
  destinations: z.array(destinationSeedSchema),
  hotels: z.array(hotelSeedSchema),
});
