import { eq, arrayContains, gte } from "drizzle-orm";
import { db } from "../db";
import { hotel } from "../db/schema";
import type {
  HotelDTO,
  HotelQuery,
  HotelWithDestinationDTO,
} from "@trip-loom/contracts/dto/hotels";
import type { PaginatedResponse } from "@trip-loom/contracts/dto/common";
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
  const { cursor, limit, search, destinationId, priceRange, minRating, amenity } = query;

  // Build conditions using shared helpers
  const whereCondition = combineConditions(
    // Domain-specific filters
    destinationId ? eq(hotel.destinationId, destinationId) : undefined,
    priceRange ? eq(hotel.priceRange, priceRange) : undefined,
    minRating ? gte(hotel.rating, minRating) : undefined,
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
  const result = await db.query.hotel.findFirst({
    where: eq(hotel.id, id),
    with: {
      destination: {
        columns: {
          name: true,
          country: true,
        },
      },
    },
  });

  if (!result || !result.destination) {
    return null;
  }

  const { destination: hotelDestination, ...hotelRow } = result;

  return {
    ...hotelRow,
    destinationName: hotelDestination.name,
    destinationCountry: hotelDestination.country,
  };
}
