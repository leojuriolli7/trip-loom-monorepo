import { and, asc, eq, not } from "drizzle-orm";
import { db } from "../db";
import { airport, flightBooking } from "../db/schema";
import { BadRequestError } from "../errors";
import type {
  AirportSummaryDTO,
  CreateFlightBookingInput,
  CreateFlightBookingResultDTO,
  FlightBookingDTO,
  FlightBookingDetailDTO,
  FlightOptionDTO,
  FlightSearchQuery,
} from "@trip-loom/contracts/dto/flights";
import { generateId } from "../lib/nanoid";
import {
  createFlightOfferToken,
  verifyFlightOfferToken,
} from "../lib/flights/offer-token";
import {
  generateFlightOptions,
  generateSeatMapForFlight,
} from "../lib/flights/generator";
import { buildSeatMapSeedKey } from "../lib/flights/seat-map";
import { getOwnedTripMeta } from "../lib/trips/ownership";
import { flightBookingSelectFields } from "../mappers/flights";
import { createPaymentSessionForBooking } from "./payments";

type ResolvedAirport = AirportSummaryDTO & {
  cityLabel: string;
};

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

const mapFlightBookingToDTO = (
  row: typeof flightBooking.$inferSelect,
): FlightBookingDTO => ({
  ...row,
  departureTime: row.departureTime.toISOString(),
  arrivalTime: row.arrivalTime.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

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

export async function searchFlights(
  params: FlightSearchQuery,
): Promise<FlightOptionDTO[]> {
  const departureAirport = await ensureAirport(params.from);
  const arrivalAirport = await ensureAirport(params.to);

  return generateFlightOptions({
    params,
    departureAirport,
    arrivalAirport,
  }).map((option) => ({
    ...option,
    offerToken: createFlightOfferToken({
      priceInCents: option.priceInCents,
      flightNumber: option.flightNumber,
      airline: option.airline,
      departureAirportCode: option.departureAirportCode,
      departureCity: option.departureCity,
      departureTime: option.departureTime,
      arrivalAirportCode: option.arrivalAirportCode,
      arrivalCity: option.arrivalCity,
      arrivalTime: option.arrivalTime,
      durationMinutes: option.durationMinutes,
      cabinClass: option.cabinClass,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    }),
  }));
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
    )
    .then((rows) => rows.map(mapFlightBookingToDTO));
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
  });

  return {
    ...mapFlightBookingToDTO(booking),
    seatMap: seatMapData.seatMap,
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

export type CreateFlightBookingResult = CreateFlightBookingResultDTO & {
  existing?: true;
};

export async function createFlightBooking(
  userId: string,
  tripId: string,
  input: CreateFlightBookingInput,
): Promise<CreateFlightBookingResult | null> {
  const ownedTrip = await getOwnedTripMeta(userId, tripId);
  if (!ownedTrip) {
    return null;
  }

  const offer = verifyFlightOfferToken(input.offerToken);

  // Idempotency guard: return existing active booking for same flight on same trip
  const existingRows = await db
    .select(flightBookingSelectFields)
    .from(flightBooking)
    .where(
      and(
        eq(flightBooking.tripId, tripId),
        eq(flightBooking.flightNumber, offer.flightNumber),
        eq(flightBooking.departureTime, new Date(offer.departureTime)),
        not(eq(flightBooking.status, "cancelled")),
      ),
    )
    .limit(1);

  if (existingRows.length > 0) {
    const existingBooking = await getFlightBooking(
      userId,
      tripId,
      existingRows[0].id,
    );
    if (!existingBooking) {
      return null;
    }

    const paymentSession = await createPaymentSessionForBooking({
      tripId,
      bookingType: "flight",
      bookingId: existingBooking.id,
      currency: "usd",
      description: `${input.type === "outbound" ? "Outbound" : "Return"} flight: ${existingBooking.flightNumber}`,
    });

    return { booking: existingBooking, paymentSession, existing: true as const };
  }
  const [departureAirport, arrivalAirport] = await Promise.all([
    ensureAirport(offer.departureAirportCode),
    ensureAirport(offer.arrivalAirportCode),
  ]);

  if (input.seatNumber) {
    const seatMap = generateSeatMapForFlight({
      seedKey: buildSeatMapSeedKey({
        flightNumber: offer.flightNumber,
        departureAirportCode: offer.departureAirportCode,
        arrivalAirportCode: offer.arrivalAirportCode,
        departureTime: new Date(offer.departureTime),
        arrivalTime: new Date(offer.arrivalTime),
        cabinClass: offer.cabinClass,
      }),
      cabinClass: offer.cabinClass,
    }).seatMap;

    const selectedSeat = seatMap
      .flatMap((row) => row.sections.flat())
      .find((seat) => seat.id === input.seatNumber);

    if (!selectedSeat) {
      throw new BadRequestError(`Seat '${input.seatNumber}' is not available for this flight`);
    }

    if (selectedSeat.isBooked) {
      throw new BadRequestError(`Seat '${input.seatNumber}' has already been taken`);
    }
  }

  const [created] = await db
    .insert(flightBooking)
    .values({
      id: generateId(),
      tripId,
      paymentId: null,
      type: input.type,
      flightNumber: offer.flightNumber,
      airline: offer.airline,
      departureAirportCode: offer.departureAirportCode,
      departureCity: departureAirport.cityLabel,
      departureTime: new Date(offer.departureTime),
      arrivalAirportCode: offer.arrivalAirportCode,
      arrivalCity: arrivalAirport.cityLabel,
      arrivalTime: new Date(offer.arrivalTime),
      durationMinutes: offer.durationMinutes,
      seatNumber: input.seatNumber ?? null,
      cabinClass: offer.cabinClass,
      priceInCents: offer.priceInCents,
      status: "pending",
    })
    .returning({ id: flightBooking.id });

  const booking = await getFlightBooking(userId, tripId, created.id);
  if (!booking) {
    return null;
  }

  const paymentSession = await createPaymentSessionForBooking({
    tripId,
    bookingType: "flight",
    bookingId: booking.id,
    currency: "usd",
    description: `${input.type === "outbound" ? "Outbound" : "Return"} flight: ${booking.flightNumber}`,
  });

  return { booking, paymentSession };
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

  return true;
}
