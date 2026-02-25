import { hotel } from "../db/schema";

/**
 * Base hotel fields for select queries.
 * Used by both list and detail endpoints to ensure consistency.
 */
export const hotelSelectFields = {
  id: hotel.id,
  destinationId: hotel.destinationId,
  name: hotel.name,
  address: hotel.address,
  latitude: hotel.latitude,
  longitude: hotel.longitude,
  imagesUrls: hotel.imagesUrls,
  rating: hotel.rating,
  amenities: hotel.amenities,
  roomTypes: hotel.roomTypes,
  priceRange: hotel.priceRange,
  avgPricePerNightInCents: hotel.avgPricePerNightInCents,
  description: hotel.description,
  createdAt: hotel.createdAt,
  updatedAt: hotel.updatedAt,
} as const;
