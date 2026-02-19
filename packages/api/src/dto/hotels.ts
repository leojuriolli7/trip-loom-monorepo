import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination";
import { amenityValues, priceRangeValues } from "../enums";

// =============================================================================
// Response Schemas
// =============================================================================

/** What the API returns for a hotel */
export const hotelSchema = z.object({
  id: z.string(),
  destinationId: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable(),
  amenities: z.array(z.enum(amenityValues)),
  priceRange: z.enum(priceRangeValues).nullable(),
  avgPricePerNightInCents: z.number().int().min(0).nullable(),
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
  minRating: z.coerce.number().min(0).max(5).optional(),
  amenity: z.enum(amenityValues).optional(),
});

export type HotelQuery = z.infer<typeof hotelQuerySchema>;
