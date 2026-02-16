import { destination } from "../db/schema";

/**
 * Base destination fields for select queries.
 * Used by both list and detail endpoints to ensure consistency.
 */
export const destinationSelectFields = {
  id: destination.id,
  name: destination.name,
  country: destination.country,
  countryCode: destination.countryCode,
  region: destination.region,
  timezone: destination.timezone,
  imageUrl: destination.imageUrl,
  description: destination.description,
  highlights: destination.highlights,
  bestTimeToVisit: destination.bestTimeToVisit,
  createdAt: destination.createdAt,
  updatedAt: destination.updatedAt,
} as const;
