import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { hotel, hotelBooking } from "../db/schema";
import type {
  CreateHotelBookingInput,
  HotelBookingDTO,
  HotelSummaryDTO,
  UpdateHotelBookingInput,
} from "../dto/hotel-bookings";
import { BadRequestError, NotFoundError } from "../errors";
import { isValidDateRange } from "../lib/date-range";
import { generateId } from "../lib/nanoid";
import { getOwnedTripMeta, refreshTripStatus } from "../lib/trips/ownership";
import { hotelSummarySelectFields } from "../mappers/hotel-bookings";

/**
 * Column selection for hotel summary in relational queries.
 */
const hotelSummaryColumns = {
  id: true,
  name: true,
  address: true,
  imageUrl: true,
  rating: true,
} as const;

/**
 * Calculates the number of nights between check-in and check-out dates.
 */
const calculateNights = (checkInDate: string, checkOutDate: string): number => {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diffMs = checkOut.getTime() - checkIn.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Maps a database row with hotel relation to the DTO format.
 */
const mapBookingToDTO = (
  row: HotelBookingDTO & {
    hotel: HotelSummaryDTO;
  },
): HotelBookingDTO => ({
  id: row.id,
  tripId: row.tripId,
  hotelId: row.hotelId,
  paymentId: row.paymentId,
  checkInDate: row.checkInDate,
  checkOutDate: row.checkOutDate,
  roomType: row.roomType,
  numberOfNights: row.numberOfNights,
  pricePerNightInCents: row.pricePerNightInCents,
  totalPriceInCents: row.totalPriceInCents,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  hotel: row.hotel,
});

/**
 * Fetches a hotel booking by ID with hotel info.
 */
const getBookingWithHotel = async (
  tripId: string,
  bookingId: string,
): Promise<HotelBookingDTO | null> => {
  const row = await db.query.hotelBooking.findFirst({
    where: and(eq(hotelBooking.tripId, tripId), eq(hotelBooking.id, bookingId)),
    with: {
      hotel: { columns: hotelSummaryColumns },
    },
  });

  if (!row) {
    return null;
  }

  return mapBookingToDTO(row);
};

/**
 * Verifies that a hotel exists and returns its summary info.
 */
const getHotelSummary = async (
  hotelId: string,
): Promise<HotelSummaryDTO | null> => {
  const rows = await db
    .select(hotelSummarySelectFields)
    .from(hotel)
    .where(eq(hotel.id, hotelId))
    .limit(1);

  return rows[0] ?? null;
};

/**
 * Lists all hotel bookings for a trip with hotel info.
 */
export async function listHotelBookings(
  userId: string,
  tripId: string,
): Promise<HotelBookingDTO[] | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const rows = await db.query.hotelBooking.findMany({
    where: eq(hotelBooking.tripId, tripId),
    with: {
      hotel: { columns: hotelSummaryColumns },
    },
    orderBy: [
      asc(hotelBooking.checkInDate),
      asc(hotelBooking.createdAt),
      asc(hotelBooking.id),
    ],
  });

  return rows.map((row) => mapBookingToDTO(row));
}

/**
 * Gets a single hotel booking by ID with hotel info.
 */
export async function getHotelBooking(
  userId: string,
  tripId: string,
  bookingId: string,
): Promise<HotelBookingDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  return getBookingWithHotel(tripId, bookingId);
}

/**
 * Creates a new hotel booking.
 * - Validates that the trip belongs to the user
 * - Validates that the hotel exists
 * - Calculates numberOfNights and totalPriceInCents
 * - Refreshes trip status (may transition draft -> upcoming)
 */
export async function createHotelBooking(
  userId: string,
  tripId: string,
  input: CreateHotelBookingInput,
): Promise<HotelBookingDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const hotelSummary = await getHotelSummary(input.hotelId);
  if (!hotelSummary) {
    throw new NotFoundError("Hotel not found");
  }

  const numberOfNights = calculateNights(input.checkInDate, input.checkOutDate);
  const totalPriceInCents = numberOfNights * input.pricePerNightInCents;

  const [created] = await db
    .insert(hotelBooking)
    .values({
      id: generateId(),
      tripId,
      hotelId: input.hotelId,
      paymentId: null,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      roomType: input.roomType,
      numberOfNights,
      pricePerNightInCents: input.pricePerNightInCents,
      totalPriceInCents,
      status: "pending",
    })
    .returning({ id: hotelBooking.id });

  await refreshTripStatus(tripMeta);
  return getBookingWithHotel(tripId, created.id);
}

/**
 * Updates an existing hotel booking.
 * - Validates ownership
 * - Recalculates nights/total if dates or price change
 * - Refreshes trip status if status changes to cancelled
 */
export async function updateHotelBooking(
  userId: string,
  tripId: string,
  bookingId: string,
  input: UpdateHotelBookingInput,
): Promise<HotelBookingDTO | null> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return null;
  }

  const existing = await getBookingWithHotel(tripId, bookingId);
  if (!existing) {
    return null;
  }

  const updateData: Partial<typeof hotelBooking.$inferInsert> = {
    updatedAt: new Date(),
  };

  // Determine final dates and price for recalculation
  const finalCheckInDate = input.checkInDate ?? existing.checkInDate;
  const finalCheckOutDate = input.checkOutDate ?? existing.checkOutDate;
  const finalPricePerNight =
    input.pricePerNightInCents ?? existing.pricePerNightInCents;

  if (
    !isValidDateRange(finalCheckInDate, finalCheckOutDate) ||
    finalCheckInDate === finalCheckOutDate
  ) {
    throw new BadRequestError("checkOutDate must be after checkInDate");
  }

  // Check if we need to recalculate nights and total
  const datesChanged =
    input.checkInDate !== undefined || input.checkOutDate !== undefined;
  const priceChanged = input.pricePerNightInCents !== undefined;

  if (datesChanged || priceChanged) {
    const numberOfNights = calculateNights(finalCheckInDate, finalCheckOutDate);
    const totalPriceInCents = numberOfNights * finalPricePerNight;

    updateData.checkInDate = finalCheckInDate;
    updateData.checkOutDate = finalCheckOutDate;
    updateData.pricePerNightInCents = finalPricePerNight;
    updateData.numberOfNights = numberOfNights;
    updateData.totalPriceInCents = totalPriceInCents;
  }

  if (input.roomType !== undefined) {
    updateData.roomType = input.roomType;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  await db
    .update(hotelBooking)
    .set(updateData)
    .where(eq(hotelBooking.id, bookingId));
  await refreshTripStatus(tripMeta);

  return getBookingWithHotel(tripId, bookingId);
}

/**
 * Cancels a hotel booking by setting its status to 'cancelled'.
 * - Validates ownership
 * - Refreshes trip status (may transition upcoming -> draft if no other travel plans)
 */
export async function cancelHotelBooking(
  userId: string,
  tripId: string,
  bookingId: string,
): Promise<boolean> {
  const tripMeta = await getOwnedTripMeta(userId, tripId);
  if (!tripMeta) {
    return false;
  }

  const updated = await db
    .update(hotelBooking)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(and(eq(hotelBooking.tripId, tripId), eq(hotelBooking.id, bookingId)))
    .returning({ id: hotelBooking.id });

  if (updated.length === 0) {
    return false;
  }

  await refreshTripStatus(tripMeta);
  return true;
}
