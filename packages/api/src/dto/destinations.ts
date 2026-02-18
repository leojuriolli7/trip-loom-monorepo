import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination";
import { regionValues, travelInterestValues } from "../enums";

// =============================================================================
// Response Schemas
// =============================================================================

/** What the API returns for a destination */
export const destinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  region: z.enum(regionValues).nullable(),
  timezone: z.string(),
  imageUrl: z.string().nullable(),
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
// Query Params (extends shared pagination schema)
// =============================================================================

/** Query params for list endpoint - extends shared pagination schema */
export const destinationQuerySchema = paginationQuerySchema.extend({
  region: z.enum(regionValues).optional(),
  country: z.string().optional(),
  highlight: z.enum(travelInterestValues).optional(),
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
