import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { trip } from "../../db/schema";

/**
 * Minimal trip metadata returned by ownership checks.
 *
 * This type contains only the fields needed for verifying ownership
 * and accessing basic trip metadata for booking/itinerary operations.
 *
 * Note: Status is computed at query time via SQL CASE expression,
 * so it's not included here. Use tripSelectFields for queries that
 * need status.
 */
export type OwnedTripMeta = {
  id: string;
  startDate: string | null;
  endDate: string | null;
};

/**
 * Retrieves minimal trip metadata if the trip exists and belongs to the user.
 *
 * This is a shared helper for services that operate on trip sub-resources
 * (flight bookings, hotel bookings, itineraries, payments) and need to:
 * 1. Verify the trip exists
 * 2. Verify the user owns the trip
 *
 * @param userId - The ID of the user claiming ownership
 * @param tripId - The ID of the trip to check
 * @returns Trip metadata if found and owned, null otherwise
 *
 * @example
 * ```ts
 * const tripMeta = await getOwnedTripMeta(userId, tripId);
 * if (!tripMeta) {
 *   return null; // Trip not found or not owned - caller returns 404
 * }
 * // Proceed with operation
 * ```
 */
export async function getOwnedTripMeta(
  userId: string,
  tripId: string,
): Promise<OwnedTripMeta | null> {
  const rows = await db
    .select({
      id: trip.id,
      startDate: trip.startDate,
      endDate: trip.endDate,
    })
    .from(trip)
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}
