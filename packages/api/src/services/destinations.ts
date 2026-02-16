import { eq, sql, arrayContains } from "drizzle-orm";
import { db } from "../db";
import { destination } from "../db/schema";
import type {
  DestinationDTO,
  DestinationQuery,
  DestinationWithStatsDTO,
} from "../dto/destinations";
import type { PaginatedResponse } from "../dto/common";
import {
  paginate,
  buildCursorCondition,
  buildSearchCondition,
  combineConditions,
  paginationOrderBy,
} from "../lib/pagination";
import { destinationSelectFields } from "../mappers/destinations";

export async function listDestinations(
  query: DestinationQuery
): Promise<PaginatedResponse<DestinationDTO>> {
  const { cursor, limit, search, region, country, highlight } = query;

  // Build conditions using shared helpers
  const whereCondition = combineConditions(
    // Domain-specific filters
    region ? eq(destination.region, region) : undefined,
    country ? eq(destination.country, country) : undefined,
    highlight ? arrayContains(destination.highlights, [highlight]) : undefined,
    // Full-text search
    buildSearchCondition(destination.searchVector, search),
    // Cursor pagination
    buildCursorCondition(cursor, destination.createdAt, destination.id)
  );

  // Execute query using shared select fields
  const results = await db
    .select(destinationSelectFields)
    .from(destination)
    .where(whereCondition)
    .orderBy(...paginationOrderBy(destination.createdAt, destination.id))
    .limit(limit + 1);

  return paginate(results, limit);
}

export async function getDestinationById(
  id: string
): Promise<DestinationWithStatsDTO | null> {
  const results = await db
    .select({
      ...destinationSelectFields,
      hotelCount: sql<number>`(
        SELECT COALESCE(COUNT(*)::int, 0)
        FROM "hotel"
        WHERE "hotel"."destination_id" = "destination"."id"
      )`,
    })
    .from(destination)
    .where(eq(destination.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return results[0];
}
