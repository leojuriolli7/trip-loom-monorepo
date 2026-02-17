import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { airport, flightBooking } from "../db/schema";
import { BadRequestError } from "../errors";
import type {
  AirportSummaryDTO,
  CreateFlightBookingInput,
  FlightBookingDTO,
  FlightBookingDetailDTO,
  FlightOptionDTO,
  FlightSearchQuery,
  UpdateFlightBookingInput,
} from "../dto/flights";
import { generateId } from "../lib/nanoid";
import {
  generateFlightOptions,
  generateSeatMapForFlight,
} from "../lib/flights/generator";
import { getOwnedTripMeta, refreshTripStatus } from "../lib/trips/ownership";
import { flightBookingSelectFields } from "../mappers/flights";

type SeatMapSource = {
  flightNumber: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: Date;
  arrivalTime: Date;
  cabinClass: FlightBookingDTO["cabinClass"];
};

type ResolvedAirport = AirportSummaryDTO & {
  cityLabel: string;
};

const buildSeatMapSeedKey = (source: SeatMapSource): string =>
  [
    source.flightNumber,
    source.departureAirportCode,
    source.arrivalAirportCode,
    source.departureTime.toISOString(),
    source.arrivalTime.toISOString(),
    source.cabinClass,
  ].join("|");

const airportSummaryFromRow = (value: typeof airport.$inferSelect): ResolvedAirport => {
  const cityLabel = value.city?.trim() || value.name;

  return {
    code: value.code.toUpperCase(),
    name: value.name,
    city: value.city,
    countryCode: value.countryCode.toUpperCase(),
    timezone: value.timezone,
    latitude: value.latitude,
    longitude: value.longitude,
    cityLabel,
  };
};

const getAirportByCode = async (code: string): Promise<ResolvedAirport | null> => {
  const normalizedCode = code.toUpperCase();
  const rows = await db
    .select()
    .from(airport)
    .where(eq(airport.code, normalizedCode))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return airportSummaryFromRow(rows[0]);
};

const ensureAirport = async (code: string): Promise<ResolvedAirport> => {
  const resolved = await getAirportByCode(code);
  if (!resolved) {
    throw new BadRequestError(`Airport code '${code}' does not exist`);
  }

  return resolved;
};

const getFlightBookingById = async (
  tripId: string,
  bookingId: string,
): Promise<FlightBookingDTO | null> => {
  const rows = await db
    .select(flightBookingSelectFields)
    .from(flightBooking)
    .where(and(eq(flightBooking.tripId, tripId), eq(flightBooking.id, bookingId)))
    .limit(1);

  return rows[0] ?? null;
};

export async function searchFlights(
  params: FlightSearchQuery,
): Promise<FlightOptionDTO[]> {
  const departureAirport = await ensureAirport(params.from);
  const arrivalAirport = await ensureAirport(params.to);

  return generateFlightOptions({
    params,
    departureAirport,
    arrivalAirport,
  });
}

export async function listFlightBookings(
  userId: string,
  tripId: string,
): Promise<FlightBookingDTO[] | null> {
  const ownedTrip = await getOwnedTripMeta(userId, tripId);
  if (!ownedTrip) {
    return null;
  }

  return db
    .select(flightBookingSelectFields)
    .from(flightBooking)
    .where(eq(flightBooking.tripId, tripId))
    .orderBy(
      asc(flightBooking.departureTime),
      asc(flightBooking.createdAt),
      asc(flightBooking.id),
    );
}

export async function getFlightBooking(
  userId: string,
  tripId: string,
  bookingId: string,
): Promise<FlightBookingDetailDTO | null> {
  const ownedTrip = await getOwnedTripMeta(userId, tripId);
  if (!ownedTrip) {
    return null;
  }

  const bookingWithAirports = await db.query.flightBooking.findFirst({
    where: and(eq(flightBooking.tripId, tripId), eq(flightBooking.id, bookingId)),
    with: {
      departureAirport: true,
      arrivalAirport: true,
    },
  });

  if (!bookingWithAirports) {
    return null;
  }

  const { departureAirport, arrivalAirport, ...booking } = bookingWithAirports;

  const seatMapData = generateSeatMapForFlight({
    seedKey: buildSeatMapSeedKey({
      flightNumber: booking.flightNumber,
      departureAirportCode: booking.departureAirportCode,
      arrivalAirportCode: booking.arrivalAirportCode,
      departureTime: booking.departureTime,
      arrivalTime: booking.arrivalTime,
      cabinClass: booking.cabinClass,
    }),
    cabinClass: booking.cabinClass,
    baseFlightPriceInCents: booking.priceInCents,
  });

  return {
    ...booking,
    seatMap: seatMapData.seatMap,
    suggestedSeatId: booking.seatNumber ?? seatMapData.suggestedSeatId,
    departureAirport: departureAirport ?? {
      code: booking.departureAirportCode,
      name: booking.departureCity,
      city: null,
      countryCode: "ZZ",
      timezone: "UTC",
      latitude: null,
      longitude: null,
    },
    arrivalAirport: arrivalAirport ?? {
      code: booking.arrivalAirportCode,
      name: booking.arrivalCity,
      city: null,
      countryCode: "ZZ",
      timezone: "UTC",
      latitude: null,
      longitude: null,
    },
  };
}

export async function createFlightBooking(
  userId: string,
  tripId: string,
  input: CreateFlightBookingInput,
): Promise<FlightBookingDTO | null> {
  const ownedTrip = await getOwnedTripMeta(userId, tripId);
  if (!ownedTrip) {
    return null;
  }

  const [departureAirport, arrivalAirport] = await Promise.all([
    ensureAirport(input.departureAirportCode),
    ensureAirport(input.arrivalAirportCode),
  ]);

  const [created] = await db
    .insert(flightBooking)
    .values({
      id: generateId(),
      tripId,
      paymentId: null,
      type: input.type,
      flightNumber: input.flightNumber,
      airline: input.airline,
      departureAirportCode: input.departureAirportCode,
      departureCity: departureAirport.cityLabel,
      departureTime: new Date(input.departureTime),
      arrivalAirportCode: input.arrivalAirportCode,
      arrivalCity: arrivalAirport.cityLabel,
      arrivalTime: new Date(input.arrivalTime),
      durationMinutes: input.durationMinutes,
      seatNumber: input.seatNumber ?? null,
      cabinClass: input.cabinClass,
      priceInCents: input.priceInCents,
      status: "pending",
    })
    .returning({ id: flightBooking.id });

  await refreshTripStatus(ownedTrip);
  return getFlightBookingById(tripId, created.id);
}

export async function updateFlightBooking(
  userId: string,
  tripId: string,
  bookingId: string,
  input: UpdateFlightBookingInput,
): Promise<FlightBookingDTO | null> {
  const ownedTrip = await getOwnedTripMeta(userId, tripId);
  if (!ownedTrip) {
    return null;
  }

  const booking = await getFlightBookingById(tripId, bookingId);
  if (!booking) {
    return null;
  }

  const updateData: Partial<typeof flightBooking.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.seatNumber !== undefined) {
    updateData.seatNumber = input.seatNumber;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  await db.update(flightBooking).set(updateData).where(eq(flightBooking.id, bookingId));
  await refreshTripStatus(ownedTrip);

  return getFlightBookingById(tripId, bookingId);
}

export async function cancelFlightBooking(
  userId: string,
  tripId: string,
  bookingId: string,
): Promise<boolean> {
  const ownedTrip = await getOwnedTripMeta(userId, tripId);
  if (!ownedTrip) {
    return false;
  }

  const updated = await db
    .update(flightBooking)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(and(eq(flightBooking.tripId, tripId), eq(flightBooking.id, bookingId)))
    .returning({ id: flightBooking.id });

  if (updated.length === 0) {
    return false;
  }

  await refreshTripStatus(ownedTrip);
  return true;
}
