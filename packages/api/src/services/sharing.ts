import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  destination,
  flightBooking,
  hotel,
  hotelBooking,
  trip,
} from "../db/schema";
import { generateId } from "../lib/nanoid";
import { getOwnedTripMeta } from "../lib/trips/ownership";
import { getItineraryDetailsByTripId } from "./itineraries";
import {
  mapTripWithDestination,
  tripDestinationSelectFields,
  tripSelectFields,
} from "../mappers/trips";

/**
 * Generates a short, URL-safe share token using nanoid.
 */
function generateShareToken(): string {
  return generateId();
}

/**
 * Enables sharing for a trip by generating a share token.
 * If the trip already has a share token, returns the existing one.
 * Returns null if trip not found or not owned by user.
 */
export async function enableTripSharing(
  userId: string,
  tripId: string,
): Promise<{ shareToken: string; shareUrl: string } | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  // Check if trip already has a share token
  const [existing] = await db
    .select({ shareToken: trip.shareToken })
    .from(trip)
    .where(eq(trip.id, tripId))
    .limit(1);

  if (existing?.shareToken) {
    return {
      shareToken: existing.shareToken,
      shareUrl: `${process.env.APP_URL}/share/${existing.shareToken}`,
    };
  }

  // Generate and save a new share token
  const shareToken = generateShareToken();

  await db
    .update(trip)
    .set({ shareToken, updatedAt: new Date() })
    .where(eq(trip.id, tripId));

  return {
    shareToken,
    shareUrl: `${process.env.APP_URL}/share/${shareToken}`,
  };
}

/**
 * Disables sharing for a trip by removing the share token.
 * Returns null if trip not found or not owned by user.
 */
export async function disableTripSharing(
  userId: string,
  tripId: string,
): Promise<boolean | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  await db
    .update(trip)
    .set({ shareToken: null, updatedAt: new Date() })
    .where(eq(trip.id, tripId));

  return true;
}

/**
 * Maps a flight booking row for the shared trip response.
 * Strips paymentId and other sensitive data.
 */
const mapSharedFlightBooking = (
  row: typeof flightBooking.$inferSelect,
) => ({
  id: row.id,
  type: row.type,
  flightNumber: row.flightNumber,
  airline: row.airline,
  departureAirportCode: row.departureAirportCode,
  departureCity: row.departureCity,
  departureTime: row.departureTime.toISOString(),
  arrivalAirportCode: row.arrivalAirportCode,
  arrivalCity: row.arrivalCity,
  arrivalTime: row.arrivalTime.toISOString(),
  durationMinutes: row.durationMinutes,
  cabinClass: row.cabinClass,
  status: row.status,
});

/**
 * Maps a hotel booking row for the shared trip response.
 * Strips paymentId and pricing data.
 */
const mapSharedHotelBooking = (
  row: typeof hotelBooking.$inferSelect & {
    hotel: {
      id: string;
      name: string;
      address: string;
      imagesUrls: Array<{ url: string; isCover: boolean; caption: string }> | null;
      rating: number | null;
    };
  },
) => ({
  id: row.id,
  hotelId: row.hotelId,
  checkInDate: row.checkInDate,
  checkOutDate: row.checkOutDate,
  roomType: row.roomType,
  numberOfNights: row.numberOfNights,
  status: row.status,
  hotel: row.hotel,
});

/**
 * Retrieves a shared trip by its share token.
 * Returns null if token doesn't exist.
 * Strips sensitive data (payments, user IDs, payment IDs, Stripe data).
 */
export async function getSharedTrip(shareToken: string) {
  // Find the trip by share token
  const [tripRow] = await db
    .select({
      ...tripSelectFields,
      destination: tripDestinationSelectFields,
    })
    .from(trip)
    .leftJoin(destination, eq(trip.destinationId, destination.id))
    .where(eq(trip.shareToken, shareToken))
    .limit(1);

  if (!tripRow) {
    return null;
  }

  const mapped = mapTripWithDestination({
    ...tripRow,
    hasFlights: false,
    hasHotel: false,
    hasItinerary: false,
  });

  // Fetch related data in parallel (no payments!)
  const [flightBookings, hotelBookingsWithHotel, itineraryDetails] =
    await Promise.all([
      db
        .select({
          id: flightBooking.id,
          tripId: flightBooking.tripId,
          paymentId: flightBooking.paymentId,
          type: flightBooking.type,
          flightNumber: flightBooking.flightNumber,
          airline: flightBooking.airline,
          departureAirportCode: flightBooking.departureAirportCode,
          departureCity: flightBooking.departureCity,
          departureTime: flightBooking.departureTime,
          arrivalAirportCode: flightBooking.arrivalAirportCode,
          arrivalCity: flightBooking.arrivalCity,
          arrivalTime: flightBooking.arrivalTime,
          durationMinutes: flightBooking.durationMinutes,
          seatNumber: flightBooking.seatNumber,
          cabinClass: flightBooking.cabinClass,
          priceInCents: flightBooking.priceInCents,
          status: flightBooking.status,
          createdAt: flightBooking.createdAt,
          updatedAt: flightBooking.updatedAt,
        })
        .from(flightBooking)
        .where(eq(flightBooking.tripId, tripRow.id))
        .orderBy(
          asc(flightBooking.departureTime),
          asc(flightBooking.createdAt),
        ),
      db
        .select({
          id: hotelBooking.id,
          tripId: hotelBooking.tripId,
          hotelId: hotelBooking.hotelId,
          paymentId: hotelBooking.paymentId,
          checkInDate: hotelBooking.checkInDate,
          checkOutDate: hotelBooking.checkOutDate,
          roomType: hotelBooking.roomType,
          numberOfNights: hotelBooking.numberOfNights,
          pricePerNightInCents: hotelBooking.pricePerNightInCents,
          totalPriceInCents: hotelBooking.totalPriceInCents,
          status: hotelBooking.status,
          createdAt: hotelBooking.createdAt,
          updatedAt: hotelBooking.updatedAt,
          hotel: {
            id: hotel.id,
            name: hotel.name,
            address: hotel.address,
            imagesUrls: hotel.imagesUrls,
            rating: hotel.rating,
          },
        })
        .from(hotelBooking)
        .innerJoin(hotel, eq(hotelBooking.hotelId, hotel.id))
        .where(eq(hotelBooking.tripId, tripRow.id))
        .orderBy(
          asc(hotelBooking.checkInDate),
          asc(hotelBooking.createdAt),
        ),
      getItineraryDetailsByTripId(tripRow.id),
    ]);

  return {
    id: mapped.id,
    title: mapped.title,
    status: mapped.status,
    startDate: mapped.startDate,
    endDate: mapped.endDate,
    destination: mapped.destination,
    flightBookings: flightBookings.map(mapSharedFlightBooking),
    hotelBookings: hotelBookingsWithHotel.map(mapSharedHotelBooking),
    itinerary: itineraryDetails,
  };
}

/**
 * Gets the share token for a trip owned by the user.
 * Returns null if trip not found/not owned, or the token (which may be null).
 */
export async function getTripShareToken(
  userId: string,
  tripId: string,
): Promise<{ shareToken: string | null } | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const [row] = await db
    .select({ shareToken: trip.shareToken })
    .from(trip)
    .where(eq(trip.id, tripId))
    .limit(1);

  return { shareToken: row?.shareToken ?? null };
}
