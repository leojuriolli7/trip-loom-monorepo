import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination";
import {
  regionValues,
  travelInterestValues,
  amenityValues,
  hotelRoomTypeValues,
  priceRangeValues,
} from "../enums";
import { arrayQueryParam } from "./common";

// =============================================================================
// Response Schemas
// =============================================================================

const destinationImageSchema = z.object({
  url: z.string(),
  isCover: z.boolean(),
  caption: z.string(),
});

/** What the API returns for a destination */
export const destinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  region: z.enum(regionValues).nullable(),
  timezone: z.string(),
  imagesUrls: z.array(destinationImageSchema).nullable(),
  description: z.string().nullable(),
  highlights: z.array(z.enum(travelInterestValues)).nullable(),
  bestTimeToVisit: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DestinationDTO = z.infer<typeof destinationSchema>;

/** With hotel count (for detail view) */
export const destinationWithStatsSchema = destinationSchema.extend({
  hotelCount: z.number(),
});

export type DestinationWithStatsDTO = z.infer<
  typeof destinationWithStatsSchema
>;

// =============================================================================
// Hotel Summary (for destination detail view)
// =============================================================================

/** Lightweight hotel info for destination detail dialog */
export const destinationHotelSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  imagesUrls: z.array(destinationImageSchema).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  priceRange: z.enum(priceRangeValues).nullable(),
  avgPricePerNightInCents: z.number().int().min(0).nullable(),
  amenities: z.array(z.enum(amenityValues)),
  roomTypes: z.array(z.enum(hotelRoomTypeValues)),
});

export type DestinationHotelSummaryDTO = z.infer<
  typeof destinationHotelSummarySchema
>;

/** Destination detail with top hotels */
export const destinationDetailSchema = destinationWithStatsSchema.extend({
  topHotels: z.array(destinationHotelSummarySchema),
});

export type DestinationDetailDTO = z.infer<typeof destinationDetailSchema>;

// =============================================================================
// Query Params (extends shared pagination schema)
// =============================================================================

/** Query params for list endpoint - extends shared pagination schema */
export const destinationQuerySchema = paginationQuerySchema.extend({
  regions: arrayQueryParam(z.enum(regionValues)),
  countries: arrayQueryParam(z.string().min(1)),
  highlights: arrayQueryParam(z.enum(travelInterestValues)),
});

export type DestinationQuery = z.infer<typeof destinationQuerySchema>;

// =============================================================================
// Recommended Destinations
// =============================================================================

/** Recommended destination with match reason and score */
export const recommendedDestinationSchema = destinationSchema.extend({
  matchReason: z.string(),
  matchScore: z.number(),
});

export type RecommendedDestinationDTO = z.infer<
  typeof recommendedDestinationSchema
>;

/** Query params for recommended endpoint */
export const recommendedDestinationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
});

export type RecommendedDestinationsQuery = z.infer<
  typeof recommendedDestinationsQuerySchema
>;
