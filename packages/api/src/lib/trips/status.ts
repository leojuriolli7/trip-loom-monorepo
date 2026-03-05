import { sql, type SQL } from "drizzle-orm";
import { trip } from "../../db/schema";
import type { TripStatus } from "@trip-loom/contracts/enums";

/**
 * SQL expression that computes trip status at query time.
 *
 * Status derivation rules:
 * 1. cancelled_at IS NOT NULL → 'cancelled'
 * 2. No travel plan (flights, hotel, itinerary) → 'draft'
 * 3. Missing dates → 'draft'
 * 4. end_date < today → 'past'
 * 5. start_date > today → 'upcoming'
 * 6. Otherwise → 'current'
 *
 * This expression can be used in both SELECT (to return status) and WHERE (to filter).
 */
export const computedTripStatusSql = sql<TripStatus>`
  CASE
    WHEN ${trip.cancelledAt} IS NOT NULL THEN 'cancelled'
    WHEN NOT (
      EXISTS (SELECT 1 FROM flight_booking WHERE flight_booking.trip_id = ${trip.id} AND flight_booking.status != 'cancelled')
      OR EXISTS (SELECT 1 FROM hotel_booking WHERE hotel_booking.trip_id = ${trip.id} AND hotel_booking.status != 'cancelled')
      OR EXISTS (SELECT 1 FROM itinerary WHERE itinerary.trip_id = ${trip.id})
    ) THEN 'draft'
    WHEN ${trip.startDate} IS NULL OR ${trip.endDate} IS NULL THEN 'draft'
    WHEN ${trip.endDate} < CURRENT_DATE THEN 'past'
    WHEN ${trip.startDate} > CURRENT_DATE THEN 'upcoming'
    ELSE 'current'
  END
`;

/**
 * Creates a SQL condition to filter trips by computed status.
 *
 * @param statuses - Array of status values to filter by
 * @returns SQL condition for WHERE clause, or undefined if no filter
 */
export const buildComputedStatusCondition = (
  statuses: TripStatus[] | undefined,
): SQL | undefined => {
  if (!statuses || statuses.length === 0) {
    return undefined;
  }

  if (statuses.length === 1) {
    return sql`${computedTripStatusSql} = ${statuses[0]}`;
  }

  // For multiple statuses: status IN ('upcoming', 'current', ...)
  const statusList = statuses.map((s) => `'${s}'`).join(", ");
  return sql`${computedTripStatusSql} IN (${sql.raw(statusList)})`;
};
