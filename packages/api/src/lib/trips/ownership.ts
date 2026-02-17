import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { trip } from "../../db/schema";
import { resolveTripStatus } from "./rules";
import { hasTripTravelPlan } from "./travel-plan";

/**
 * Minimal trip metadata returned by ownership checks.
 *
 * This type contains only the fields needed for:
 * - Status transition logic (status, startDate, endDate)
 * - Booking/itinerary operations that need trip context
 *
 * Use this instead of fetching full trip details when you only need
 * to verify ownership and access basic trip metadata.
 */
export type OwnedTripMeta = {
  id: string;
  status: (typeof trip.$inferSelect)["status"];
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
 * 3. Access trip metadata for status transitions
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
 * // Proceed with operation using tripMeta.status, etc.
 * ```
 */
export async function getOwnedTripMeta(
  userId: string,
  tripId: string,
): Promise<OwnedTripMeta | null> {
  const rows = await db
    .select({
      id: trip.id,
      status: trip.status,
      startDate: trip.startDate,
      endDate: trip.endDate,
    })
    .from(trip)
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Re-evaluates and updates the trip status after booking/itinerary changes.
 *
 * Call this after creating, updating, or cancelling a booking or itinerary
 * to ensure the trip status reflects the current state of travel plans.
 *
 * The function:
 * 1. Checks if the trip still has active travel plans (bookings/itinerary)
 * 2. Derives the appropriate status based on dates and travel plans
 * 3. Updates the trip if the status changed
 *
 * @param tripMeta - The trip metadata from getOwnedTripMeta
 *
 * @example
 * ```ts
 * await createHotelBooking(...);
 * await refreshTripStatus(tripMeta); // May transition draft -> upcoming
 * ```
 */
export async function refreshTripStatus(tripMeta: OwnedTripMeta): Promise<void> {
  const nextStatus = resolveTripStatus({
    currentStatus: tripMeta.status,
    requestedStatus: undefined,
    startDate: tripMeta.startDate,
    endDate: tripMeta.endDate,
    hasTravelPlan: await hasTripTravelPlan(tripMeta.id),
  });

  if (nextStatus === tripMeta.status) {
    return;
  }

  await db
    .update(trip)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(trip.id, tripMeta.id));
}
