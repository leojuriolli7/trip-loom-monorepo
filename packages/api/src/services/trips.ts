import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  destination,
  flightBooking,
  hotel,
  hotelBooking,
  payment,
  trip,
} from "../db/schema";
import type { PaginatedResponse } from "@trip-loom/contracts/dto/common";
import type {
  CreateTripInput,
  TripDetailDTO,
  TripQuery,
  TripWithDestinationDTO,
  UpdateTripInput,
} from "@trip-loom/contracts/dto/trips";
import type { HotelSummaryDTO } from "@trip-loom/contracts/dto/hotel-bookings";
import { isDateTodayOrLater, isValidDateRange } from "../lib/date-range";
import {
  buildComputedStatusCondition,
  computedTripStatusSql,
} from "../lib/trips/status";
import { BadRequestError } from "../errors";
import { generateId } from "../lib/nanoid";
import {
  buildCursorCondition,
  combineConditions,
  paginate,
  paginationOrderBy,
} from "../lib/pagination";
import {
  mapTripWithDestination,
  tripDestinationSelectFields,
  tripSelectFields,
} from "../mappers/trips";
import { paymentSelectFields } from "../mappers/payments";
import { flightBookingSelectFields } from "../mappers/flights";
import {
  hotelBookingSelectFields,
  hotelSummarySelectFields,
} from "../mappers/hotel-bookings";
import { getItineraryDetailsByTripId } from "./itineraries";

const mapTripFlightBooking = (
  row: typeof flightBooking.$inferSelect,
) => ({
  ...row,
  departureTime: row.departureTime.toISOString(),
  arrivalTime: row.arrivalTime.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const mapTripHotelBooking = (
  row: typeof hotelBooking.$inferSelect & { hotel: HotelSummaryDTO },
) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const mapTripPayment = (row: typeof payment.$inferSelect) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const buildTripSearchCondition = (
  search: string | undefined,
): SQL | undefined => {
  if (!search?.trim()) {
    return undefined;
  }

  const term = `%${search.trim()}%`;
  return or(
    ilike(trip.title, term),
    ilike(destination.name, term),
    ilike(destination.country, term),
  );
};

const tripWithDestinationSelectFields = {
  ...tripSelectFields,
  destination: tripDestinationSelectFields,
  hasFlights: sql<boolean>`exists (
    select 1
    from flight_booking
    where flight_booking.trip_id = ${trip.id}
  )`,
  hasHotel: sql<boolean>`exists (
    select 1
    from hotel_booking
    where hotel_booking.trip_id = ${trip.id}
  )`,
  hasItinerary: sql<boolean>`exists (
    select 1
    from itinerary
    where itinerary.trip_id = ${trip.id}
  )`,
} as const;

const destinationExists = async (destinationId: string): Promise<boolean> => {
  const rows = await db
    .select({ id: destination.id })
    .from(destination)
    .where(eq(destination.id, destinationId))
    .limit(1);

  return rows.length > 0;
};

const ensureDestinationExists = async (
  destinationId: string | null | undefined,
) => {
  if (!destinationId) {
    return;
  }

  if (!(await destinationExists(destinationId))) {
    throw new BadRequestError("Destination not found");
  }
};

const ensureTripDatesAreNotInPast = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) => {
  if (!isDateTodayOrLater(startDate) || !isDateTodayOrLater(endDate)) {
    throw new BadRequestError("Trip dates cannot be before today");
  }
};

const getTripWithDestinationById = async (
  userId: string,
  tripId: string,
): Promise<TripWithDestinationDTO | null> => {
  const rows = await db
    .select(tripWithDestinationSelectFields)
    .from(trip)
    .leftJoin(destination, eq(trip.destinationId, destination.id))
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return mapTripWithDestination(rows[0]);
};

export async function listTrips(
  userId: string,
  query: TripQuery,
): Promise<PaginatedResponse<TripWithDestinationDTO>> {
  const { cursor, limit, search, status, destinationId, archived } = query;

  const whereCondition = combineConditions(
    eq(trip.userId, userId),
    eq(trip.archived, archived ?? false),
    buildComputedStatusCondition(status),
    destinationId ? eq(trip.destinationId, destinationId) : undefined,
    buildTripSearchCondition(search),
    buildCursorCondition(cursor, trip.updatedAt, trip.id),
  );

  const rows = await db
    .select(tripWithDestinationSelectFields)
    .from(trip)
    .leftJoin(destination, eq(trip.destinationId, destination.id))
    .where(whereCondition)
    .orderBy(...paginationOrderBy(trip.updatedAt, trip.id))
    .limit(limit + 1);

  return paginate(
    rows.map((row) => mapTripWithDestination(row)),
    limit,
    {
      getCursorDate: (item) => item.updatedAt,
    },
  );
}

export async function getTripById(
  userId: string,
  tripId: string,
): Promise<TripDetailDTO | null> {
  const baseTrip = await getTripWithDestinationById(userId, tripId);
  if (!baseTrip) {
    return null;
  }

  // Fetch all related data in parallel:
  // - Flight bookings, hotel bookings, payments: 3 queries
  // - Itinerary with days and activities: 1 relational query (replaces 3 separate queries)
  const [flightBookings, hotelBookingsWithHotel, payments, itineraryDetails] =
    await Promise.all([
      db
        .select(flightBookingSelectFields)
        .from(flightBooking)
        .where(eq(flightBooking.tripId, tripId))
        .orderBy(
          asc(flightBooking.departureTime),
          asc(flightBooking.createdAt),
          asc(flightBooking.id),
        ),
      db
        .select({
          ...hotelBookingSelectFields,
          hotel: hotelSummarySelectFields,
        })
        .from(hotelBooking)
        .innerJoin(hotel, eq(hotelBooking.hotelId, hotel.id))
        .where(eq(hotelBooking.tripId, tripId))
        .orderBy(
          asc(hotelBooking.checkInDate),
          asc(hotelBooking.createdAt),
          asc(hotelBooking.id),
        ),
      db
        .select(paymentSelectFields)
        .from(payment)
        .where(eq(payment.tripId, tripId))
        .orderBy(desc(payment.createdAt), desc(payment.id)),
      getItineraryDetailsByTripId(tripId),
    ]);

  return {
    ...baseTrip,
    flightBookings: flightBookings.map(mapTripFlightBooking),
    hotelBookings: hotelBookingsWithHotel.map(mapTripHotelBooking),
    itinerary: itineraryDetails,
    payments: payments.map(mapTripPayment),
  };
}

export async function createTrip(
  userId: string,
  input: CreateTripInput,
): Promise<TripWithDestinationDTO> {
  ensureTripDatesAreNotInPast(input.startDate, input.endDate);

  if (!isValidDateRange(input.startDate, input.endDate)) {
    throw new BadRequestError("startDate must be before or equal to endDate");
  }

  await ensureDestinationExists(input.destinationId);

  const [createdTrip] = await db
    .insert(trip)
    .values({
      id: generateId(),
      userId,
      destinationId: input.destinationId ?? null,
      title: input.title ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      // cancelledAt defaults to null (not cancelled)
      // status is computed at query time
    })
    .returning({ id: trip.id });

  const created = await getTripWithDestinationById(userId, createdTrip.id);
  if (!created) {
    throw new Error("Trip was created but could not be retrieved");
  }

  return created;
}

export async function updateTrip(
  userId: string,
  tripId: string,
  input: UpdateTripInput,
): Promise<TripWithDestinationDTO | null> {
  const existingRows = await db
    .select({
      id: trip.id,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: computedTripStatusSql,
    })
    .from(trip)
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)))
    .limit(1);

  if (existingRows.length === 0) {
    return null;
  }

  const existing = existingRows[0];

  if (existing.status === "past" || existing.status === "cancelled") {
    throw new BadRequestError("Cannot update a past or cancelled trip");
  }

  await ensureDestinationExists(input.destinationId);

  const nextStartDate =
    input.startDate !== undefined ? input.startDate : existing.startDate;
  const nextEndDate =
    input.endDate !== undefined ? input.endDate : existing.endDate;

  ensureTripDatesAreNotInPast(nextStartDate, nextEndDate);

  if (!isValidDateRange(nextStartDate, nextEndDate)) {
    throw new BadRequestError("startDate must be before or equal to endDate");
  }

  const updateData: Partial<typeof trip.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.destinationId !== undefined) {
    updateData.destinationId = input.destinationId;
  }

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.archived !== undefined) {
    updateData.archived = input.archived;
  }

  if (input.startDate !== undefined) {
    updateData.startDate = input.startDate;
  }

  if (input.endDate !== undefined) {
    updateData.endDate = input.endDate;
  }

  await db
    .update(trip)
    .set(updateData)
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)));

  const updated = await getTripWithDestinationById(userId, tripId);
  if (!updated) {
    throw new Error("Trip was updated but could not be retrieved");
  }

  return updated;
}

export async function deleteTrip(
  userId: string,
  tripId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(trip)
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)))
    .returning({ id: trip.id });

  return deleted.length > 0;
}
