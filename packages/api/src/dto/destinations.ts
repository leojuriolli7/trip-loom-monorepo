import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination";

// =============================================================================
// Response Schemas
// =============================================================================

/** What the API returns for a destination */
export const destinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  region: z.string().nullable(),
  timezone: z.string(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  highlights: z.array(z.string()).nullable(),
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
  region: z.string().optional(),
  country: z.string().optional(),
  highlight: z.string().optional(),
});

export type DestinationQuery = z.infer<typeof destinationQuerySchema>;
