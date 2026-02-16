import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination";
import { priceRangeEnum } from "../db/schema";

// =============================================================================
// Response Schemas
// =============================================================================

/** Price range enum values derived from DB schema */
export const priceRangeValues = priceRangeEnum.enumValues;

/** What the API returns for a hotel */
export const hotelSchema = z.object({
  id: z.string(),
  destinationId: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().nullable(),
  starRating: z.number().int().min(1).max(5),
  amenities: z.array(z.string()),
  priceRange: z.enum(priceRangeValues),
  avgPricePerNightInCents: z.number().int().min(0),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HotelDTO = z.infer<typeof hotelSchema>;

/** With destination info (for detail view) */
export const hotelWithDestinationSchema = hotelSchema.extend({
  destinationName: z.string(),
  destinationCountry: z.string(),
});

export type HotelWithDestinationDTO = z.infer<typeof hotelWithDestinationSchema>;

// =============================================================================
// Query Params (extends shared pagination schema)
// =============================================================================

/** Query params for list endpoint - extends shared pagination schema */
export const hotelQuerySchema = paginationQuerySchema.extend({
  destinationId: z.string().optional(),
  priceRange: z.enum(priceRangeValues).optional(),
  minStarRating: z.coerce.number().int().min(1).max(5).optional(),
  amenity: z.string().optional(),
});

export type HotelQuery = z.infer<typeof hotelQuerySchema>;
