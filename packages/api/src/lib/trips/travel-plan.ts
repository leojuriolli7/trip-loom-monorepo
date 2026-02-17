import { sql } from "drizzle-orm";
import { db } from "../../db";

/**
 * Checks if a trip has any active travel plan data.
 *
 * A trip has a travel plan when it has at least one:
 * - Non-cancelled flight booking
 * - Non-cancelled hotel booking
 * - Itinerary
 *
 * This uses a single optimized query with EXISTS for short-circuit evaluation.
 * As soon as any matching row is found, the query returns immediately.
 */
export const hasTripTravelPlan = async (tripId: string): Promise<boolean> => {
  const result = await db.execute<{ has_travel_plan: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM flight_booking
      WHERE trip_id = ${tripId} AND status != 'cancelled'
      UNION ALL
      SELECT 1 FROM hotel_booking
      WHERE trip_id = ${tripId} AND status != 'cancelled'
      UNION ALL
      SELECT 1 FROM itinerary
      WHERE trip_id = ${tripId}
    ) AS has_travel_plan
  `);

  // postgres-js returns an array directly, not { rows: [] }
  return result[0]?.has_travel_plan ?? false;
};
