import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../db";
import {
  destination,
  flightBooking,
  hotel,
  hotelBooking,
  itinerary,
  itineraryActivity,
  itineraryDay,
  payment,
  trip,
} from "../db/schema";
import type { PaginatedResponse } from "../dto/common";
import type {
  ItineraryActivityDTO,
  ItineraryDetailDTO,
} from "../dto/itineraries";
import type {
  CreateTripInput,
  TripDetailDTO,
  TripQuery,
  TripWithDestinationDTO,
  UpdateTripInput,
} from "../dto/trips";
import { isValidDateRange } from "../lib/date-range";
import { resolveTripStatus } from "../lib/trips/rules";
import { BadRequestError } from "../errors";
import { generateId } from "../lib/nanoid";
import {
  buildCursorCondition,
  combineConditions,
  paginate,
  paginationOrderBy,
} from "../lib/pagination";
import {
  flightBookingSelectFields,
  hotelBookingSelectFields,
  hotelSummarySelectFields,
  itineraryActivitySelectFields,
  itineraryDaySelectFields,
  itinerarySelectFields,
  mapTripWithDestination,
  paymentSelectFields,
  tripDestinationSelectFields,
  tripSelectFields,
} from "../mappers/trips";

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

const getTripWithDestinationById = async (
  userId: string,
  tripId: string,
): Promise<TripWithDestinationDTO | null> => {
  const rows = await db
    .select({
      ...tripSelectFields,
      destination: tripDestinationSelectFields,
    })
    .from(trip)
    .leftJoin(destination, eq(trip.destinationId, destination.id))
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return mapTripWithDestination(rows[0]);
};

const hasTripTravelPlan = async (tripId: string): Promise<boolean> => {
  const [flightCountRows, hotelCountRows, itineraryCountRows] =
    await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(flightBooking)
        .where(eq(flightBooking.tripId, tripId)),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(hotelBooking)
        .where(eq(hotelBooking.tripId, tripId)),
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

export async function listTrips(
  userId: string,
  query: TripQuery,
): Promise<PaginatedResponse<TripWithDestinationDTO>> {
  const { cursor, limit, search, status, destinationId } = query;

  const whereCondition = combineConditions(
    eq(trip.userId, userId),
    status ? eq(trip.status, status) : undefined,
    destinationId ? eq(trip.destinationId, destinationId) : undefined,
    buildTripSearchCondition(search),
    buildCursorCondition(cursor, trip.createdAt, trip.id),
  );

  const rows = await db
    .select({
      ...tripSelectFields,
      destination: tripDestinationSelectFields,
    })
    .from(trip)
    .leftJoin(destination, eq(trip.destinationId, destination.id))
    .where(whereCondition)
    .orderBy(...paginationOrderBy(trip.createdAt, trip.id))
    .limit(limit + 1);

  return paginate(
    rows.map((row) => mapTripWithDestination(row)),
    limit,
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

  const [flightBookings, hotelBookingsWithHotel, payments, itineraryRows] =
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
      db
        .select(itinerarySelectFields)
        .from(itinerary)
        .where(eq(itinerary.tripId, tripId))
        .limit(1),
    ]);

  let itineraryDetails: ItineraryDetailDTO | null = null;

  if (itineraryRows.length > 0) {
    const itineraryRow = itineraryRows[0];

    const dayRows = await db
      .select(itineraryDaySelectFields)
      .from(itineraryDay)
      .where(eq(itineraryDay.itineraryId, itineraryRow.id))
      .orderBy(asc(itineraryDay.dayNumber), asc(itineraryDay.createdAt));

    let activityRows: ItineraryActivityDTO[] = [];
    if (dayRows.length > 0) {
      const dayIds = dayRows.map((day) => day.id);
      activityRows = await db
        .select(itineraryActivitySelectFields)
        .from(itineraryActivity)
        .where(inArray(itineraryActivity.itineraryDayId, dayIds))
        .orderBy(
          asc(itineraryActivity.itineraryDayId),
          asc(itineraryActivity.orderIndex),
          asc(itineraryActivity.createdAt),
        );
    }

    const activitiesByDayId = new Map<string, ItineraryActivityDTO[]>();
    for (const activity of activityRows) {
      const existing = activitiesByDayId.get(activity.itineraryDayId) ?? [];
      existing.push(activity);
      activitiesByDayId.set(activity.itineraryDayId, existing);
    }

    itineraryDetails = {
      ...itineraryRow,
      days: dayRows.map((day) => ({
        ...day,
        activities: activitiesByDayId.get(day.id) ?? [],
      })),
    };
  }

  return {
    ...baseTrip,
    flightBookings,
    hotelBookings: hotelBookingsWithHotel,
    itinerary: itineraryDetails,
    payments,
  };
}

export async function createTrip(
  userId: string,
  input: CreateTripInput,
): Promise<TripWithDestinationDTO> {
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
      status: "draft",
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
      status: trip.status,
      startDate: trip.startDate,
      endDate: trip.endDate,
    })
    .from(trip)
    .where(and(eq(trip.id, tripId), eq(trip.userId, userId)))
    .limit(1);

  if (existingRows.length === 0) {
    return null;
  }

  await ensureDestinationExists(input.destinationId);

  const existing = existingRows[0];
  const nextStartDate =
    input.startDate !== undefined ? input.startDate : existing.startDate;
  const nextEndDate =
    input.endDate !== undefined ? input.endDate : existing.endDate;

  if (!isValidDateRange(nextStartDate, nextEndDate)) {
    throw new BadRequestError("startDate must be before or equal to endDate");
  }

  const nextStatus = resolveTripStatus({
    currentStatus: existing.status,
    requestedStatus: input.status,
    startDate: nextStartDate,
    endDate: nextEndDate,
    hasTravelPlan: await hasTripTravelPlan(tripId),
  });

  const updateData: Partial<typeof trip.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.destinationId !== undefined) {
    updateData.destinationId = input.destinationId;
  }

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.startDate !== undefined) {
    updateData.startDate = input.startDate;
  }

  if (input.endDate !== undefined) {
    updateData.endDate = input.endDate;
  }

  if (nextStatus !== existing.status) {
    updateData.status = nextStatus;
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
