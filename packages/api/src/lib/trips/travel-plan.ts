import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "../../db";
import { flightBooking, hotelBooking, itinerary } from "../../db/schema";

/**
 * A trip has a travel plan when it has at least one non-cancelled booking
 * (flight/hotel) or an itinerary.
 */
export const hasTripTravelPlan = async (tripId: string): Promise<boolean> => {
  const [flightCountRows, hotelCountRows, itineraryCountRows] =
    await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(flightBooking)
        .where(
          and(
            eq(flightBooking.tripId, tripId),
            ne(flightBooking.status, "cancelled"),
          ),
        ),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(hotelBooking)
        .where(
          and(
            eq(hotelBooking.tripId, tripId),
            ne(hotelBooking.status, "cancelled"),
          ),
        ),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(itinerary)
        .where(eq(itinerary.tripId, tripId)),
    ]);

  const flightCount = flightCountRows[0]?.count ?? 0;
  const hotelCount = hotelCountRows[0]?.count ?? 0;
  const itineraryCount = itineraryCountRows[0]?.count ?? 0;

  return flightCount > 0 || hotelCount > 0 || itineraryCount > 0;
};
