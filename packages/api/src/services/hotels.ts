import { eq, sql, arrayContains, gte } from "drizzle-orm";
import { db } from "../db";
import { hotel, destination } from "../db/schema";
import type {
  HotelDTO,
  HotelQuery,
  HotelWithDestinationDTO,
} from "../dto/hotels";
import type { PaginatedResponse } from "../dto/common";
import {
  paginate,
  buildCursorCondition,
  buildSearchCondition,
  combineConditions,
  paginationOrderBy,
} from "../lib/pagination";
import { hotelSelectFields } from "../mappers/hotels";

export async function listHotels(
  query: HotelQuery
): Promise<PaginatedResponse<HotelDTO>> {
  const { cursor, limit, search, destinationId, priceRange, minStarRating, amenity } = query;

  // Build conditions using shared helpers
  const whereCondition = combineConditions(
    // Domain-specific filters
    destinationId ? eq(hotel.destinationId, destinationId) : undefined,
    priceRange ? eq(hotel.priceRange, priceRange) : undefined,
    minStarRating ? gte(hotel.starRating, minStarRating) : undefined,
    amenity ? arrayContains(hotel.amenities, [amenity]) : undefined,
    // Full-text search
    buildSearchCondition(hotel.searchVector, search),
    // Cursor pagination
    buildCursorCondition(cursor, hotel.createdAt, hotel.id)
  );

  // Execute query using shared select fields
  const results = await db
    .select(hotelSelectFields)
    .from(hotel)
    .where(whereCondition)
    .orderBy(...paginationOrderBy(hotel.createdAt, hotel.id))
    .limit(limit + 1);

  return paginate(results, limit);
}

export async function getHotelById(
  id: string
): Promise<HotelWithDestinationDTO | null> {
  const results = await db
    .select({
      ...hotelSelectFields,
      destinationName: destination.name,
      destinationCountry: destination.country,
    })
    .from(hotel)
    .innerJoin(destination, eq(hotel.destinationId, destination.id))
    .where(eq(hotel.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return results[0];
}
