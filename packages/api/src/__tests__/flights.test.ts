import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { db } from "../db";
import { airport, flightBooking, itinerary, payment, trip, user } from "../db/schema";
import { paymentProvider } from "../lib/payments/provider";
import { flightRoutes } from "../routes/flights";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
  dateWithOffset,
} from "./harness";

const ctx = createTestContext("flight");
const app = createTestApp().use(flightRoutes);
const request = createJsonRequester(app);
const requestJson = request.requestJson;
const authMock = createHeaderAuthMock(ctx.prefix);

type SeedData = {
  primaryUserId: string;
  secondaryUserId: string;
  draftTripId: string;
  upcomingTripId: string;
  secondaryTripId: string;
  primaryBookingId: string;
  secondaryBookingId: string;
};

let seed: SeedData;

const createPaymentIntentSpy = spyOn(paymentProvider, "createPaymentIntent");
const retrievePaymentIntentSpy = spyOn(paymentProvider, "retrievePaymentIntent");

const cleanupFlightsFixtureData = async () => {
  await ctx.cleanup();
};

const seedFlightsFixtureData = async () => {
  const baseTime = Date.parse("2025-06-01T00:00:00.000Z");
  const primaryUserId = `${ctx.prefix}user_primary`;
  const secondaryUserId = `${ctx.prefix}user_secondary`;
  const draftTripId = `${ctx.prefix}trip_draft`;
  const upcomingTripId = `${ctx.prefix}trip_upcoming`;
  const secondaryTripId = `${ctx.prefix}trip_secondary`;
  const primaryBookingId = `${ctx.prefix}booking_primary`;
  const secondaryBookingId = `${ctx.prefix}booking_secondary`;

  const requiredAirports = [
    {
      code: "JFK",
      icao: "KJFK",
      name: "John F. Kennedy International Airport",
      city: "New York",
      countryCode: "TS",
      continent: "NA",
      timezone: "America/New_York",
      latitude: 40.6413,
      longitude: -73.7781,
      airportType: "large_airport",
      scheduledService: true,
    },
    {
      code: "LAX",
      icao: "KLAX",
      name: "Los Angeles International Airport",
      city: "Los Angeles",
      countryCode: "TS",
      continent: "NA",
      timezone: "America/Los_Angeles",
      latitude: 33.9416,
      longitude: -118.4085,
      airportType: "large_airport",
      scheduledService: true,
    },
    {
      code: "ORD",
      icao: "KORD",
      name: "O'Hare International Airport",
      city: "Chicago",
      countryCode: "TS",
      continent: "NA",
      timezone: "America/Chicago",
      latitude: 41.9742,
      longitude: -87.9073,
      airportType: "large_airport",
      scheduledService: true,
    },
    {
      code: "MIA",
      icao: "KMIA",
      name: "Miami International Airport",
      city: "Miami",
      countryCode: "TS",
      continent: "NA",
      timezone: "America/New_York",
      latitude: 25.7959,
      longitude: -80.287,
      airportType: "large_airport",
      scheduledService: true,
    },
    {
      code: "BOS",
      icao: "KBOS",
      name: "Boston Logan International Airport",
      city: "Boston",
      countryCode: "TS",
      continent: "NA",
      timezone: "America/New_York",
      latitude: 42.3656,
      longitude: -71.0096,
      airportType: "large_airport",
      scheduledService: true,
    },
    {
      code: "LHR",
      icao: "EGLL",
      name: "London Heathrow Airport",
      city: "London",
      countryCode: "TS",
      continent: "EU",
      timezone: "Europe/London",
      latitude: 51.47,
      longitude: -0.4543,
      airportType: "large_airport",
      scheduledService: true,
    },
  ] as const;

  await Promise.all(
    requiredAirports.map((row) =>
      db
        .insert(airport)
        .values(row)
        .onConflictDoUpdate({
          target: airport.code,
          set: {
            icao: row.icao,
            name: row.name,
            city: row.city,
            countryCode: row.countryCode,
            continent: row.continent,
            timezone: row.timezone,
            latitude: row.latitude,
            longitude: row.longitude,
            airportType: row.airportType,
            scheduledService: row.scheduledService,
            updatedAt: new Date(),
          },
        }),
    ),
  );

  await db.insert(user).values([
    {
      id: primaryUserId,
      name: "Primary User",
      email: `${primaryUserId}@example.test`,
      emailVerified: true,
    },
    {
      id: secondaryUserId,
      name: "Secondary User",
      email: `${secondaryUserId}@example.test`,
      emailVerified: true,
    },
  ]);

  await db.insert(trip).values([
    {
      id: draftTripId,
      userId: primaryUserId,
      destinationId: null,
      title: "Draft With Future Dates",
      startDate: dateWithOffset(30),
      endDate: dateWithOffset(36),
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
    },
    {
      id: upcomingTripId,
      userId: primaryUserId,
      destinationId: null,
      title: "Upcoming Primary Trip",
      startDate: dateWithOffset(40),
      endDate: dateWithOffset(48),
      createdAt: new Date(baseTime + 1_000),
      updatedAt: new Date(baseTime + 1_000),
    },
    {
      id: secondaryTripId,
      userId: secondaryUserId,
      destinationId: null,
      title: "Secondary User Trip",
      startDate: dateWithOffset(18),
      endDate: dateWithOffset(24),
      createdAt: new Date(baseTime + 2_000),
      updatedAt: new Date(baseTime + 2_000),
    },
  ]);

  await db.insert(flightBooking).values([
    {
      id: primaryBookingId,
      tripId: upcomingTripId,
      paymentId: null,
      type: "outbound",
      flightNumber: "TL220",
      airline: "TripLoom Airways",
      departureAirportCode: "JFK",
      departureCity: "New York",
      departureTime: new Date("2026-07-20T14:00:00.000Z"),
      arrivalAirportCode: "LAX",
      arrivalCity: "Los Angeles",
      arrivalTime: new Date("2026-07-20T20:00:00.000Z"),
      durationMinutes: 360,
      seatNumber: "12A",
      cabinClass: "economy",
      priceInCents: 42_000,
      status: "confirmed",
      createdAt: new Date(baseTime + 3_000),
      updatedAt: new Date(baseTime + 3_000),
    },
    {
      id: secondaryBookingId,
      tripId: secondaryTripId,
      paymentId: null,
      type: "outbound",
      flightNumber: "SK410",
      airline: "SkyWave Airlines",
      departureAirportCode: "ORD",
      departureCity: "Chicago",
      departureTime: new Date("2026-08-12T11:00:00.000Z"),
      arrivalAirportCode: "MIA",
      arrivalCity: "Miami",
      arrivalTime: new Date("2026-08-12T14:05:00.000Z"),
      durationMinutes: 185,
      seatNumber: "6C",
      cabinClass: "business",
      priceInCents: 55_000,
      status: "pending",
      createdAt: new Date(baseTime + 4_000),
      updatedAt: new Date(baseTime + 4_000),
    },
  ]);

  seed = {
    primaryUserId,
    secondaryUserId,
    draftTripId,
    upcomingTripId,
    secondaryTripId,
    primaryBookingId,
    secondaryBookingId,
  };
};

describe("Flights API", () => {
  beforeAll(async () => {
    authMock.enable();
  });

  beforeEach(async () => {
    await cleanupFlightsFixtureData();
    await seedFlightsFixtureData();
    createPaymentIntentSpy.mockReset();
    retrievePaymentIntentSpy.mockReset();
  });

  afterAll(async () => {
    await cleanupFlightsFixtureData();
    authMock.restore();
    createPaymentIntentSpy.mockRestore();
    retrievePaymentIntentSpy.mockRestore();
  });

  describe("GET /api/flights/search", () => {
    it("generates deterministic flight options with seat maps and offer tokens", async () => {
      const path = "/api/flights/search?from=JFK&to=LAX&date=2026-09-20&cabinClass=economy&passengers=2";

      const first = await requestJson({ method: "GET", path, userId: seed.primaryUserId });
      const second = await requestJson({ method: "GET", path, userId: seed.primaryUserId });

      expect(first.res.status).toBe(200);
      expect(second.res.status).toBe(200);
      expect(first.body).toHaveLength(second.body.length);

      const comparableFirst = first.body.map(({ offerToken, ...option }: { offerToken: string }) => option);
      const comparableSecond = second.body.map(({ offerToken, ...option }: { offerToken: string }) => option);
      expect(comparableFirst).toEqual(comparableSecond);
      expect(first.body.every((option: { offerToken: string }) => option.offerToken.length > 0)).toBe(true);
      expect(second.body.every((option: { offerToken: string }) => option.offerToken.length > 0)).toBe(true);

      const firstOption = first.body[0];
      expect(firstOption).toMatchObject({
        departureAirportCode: "JFK",
        arrivalAirportCode: "LAX",
        cabinClass: "economy",
      });
      expect(firstOption.offerToken).toEqual(expect.any(String));
      expect(Array.isArray(firstOption.seatMap)).toBe(true);
      expect(firstOption.availableSeats).toBeGreaterThan(0);
    });

    it("returns 400 when airport code does not exist in DB", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=ZZZ&to=LAX&date=2026-09-20",
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(400);
      expect(body.message).toContain("ZZZ");
    });
  });

  describe("Booking CRUD", () => {
    it("protects booking endpoints", async () => {
      const calls = await Promise.all([
        requestJson({ method: "GET", path: `/api/trips/${seed.upcomingTripId}/flights` }),
        requestJson({
          method: "POST",
          path: `/api/trips/${seed.upcomingTripId}/flights`,
          body: { type: "outbound", offerToken: "invalid" },
        }),
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        }),
      ]);

      for (const response of calls) {
        expect(response.res.status).toBe(401);
        expect(response.body).toMatchObject({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }
    });

    it("creates a booking and payment session from an offer token", async () => {
      createPaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_created`,
        clientSecret: `${ctx.prefix}secret_created`,
        status: "requires_payment_method",
        customerId: `${ctx.prefix}cus_created`,
        metadata: {},
      });

      const search = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=BOS&to=LHR&date=2026-10-10&cabinClass=economy&passengers=1",
        userId: seed.primaryUserId,
      });
      const option = search.body[0];
      const firstAvailableSeat = option.seatMap
        .flatMap((row: { sections: Array<Array<{ id: string; isBooked: boolean }>> }) => row.sections.flat())
        .find((seat: { id: string; isBooked: boolean }) => !seat.isBooked);

      expect(firstAvailableSeat).toBeDefined();

      const create = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/flights`,
        userId: seed.primaryUserId,
        body: {
          type: "outbound",
          offerToken: option.offerToken,
          seatNumber: firstAvailableSeat!.id,
        },
      });

      expect(create.res.status).toBe(201);
      expect(create.body.booking).toMatchObject({
        tripId: seed.draftTripId,
        type: "outbound",
        seatNumber: firstAvailableSeat!.id,
        status: "pending",
      });
      expect(create.body.booking.departureTime).toEqual(expect.any(String));
      expect(create.body.paymentSession).toMatchObject({
        amountInCents: create.body.booking.priceInCents,
        status: "pending",
        clientSecret: `${ctx.prefix}secret_created`,
      });

      const paymentRows = await db
        .select({ amountInCents: payment.amountInCents, status: payment.status })
        .from(payment)
        .where(eq(payment.id, create.body.paymentSession.id))
        .limit(1);
      expect(paymentRows[0]).toMatchObject({
        amountInCents: create.body.booking.priceInCents,
        status: "pending",
      });
    });

    it("returns an existing active booking with a reused payment session", async () => {
      createPaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_created`,
        clientSecret: `${ctx.prefix}secret_first`,
        status: "requires_payment_method",
        customerId: `${ctx.prefix}cus_first`,
        metadata: {},
      });

      const search = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=BOS&to=LHR&date=2026-10-12&cabinClass=business&passengers=1",
        userId: seed.primaryUserId,
      });
      const option = search.body[0];
      const firstAvailableSeat = option.seatMap
        .flatMap((row: { sections: Array<Array<{ id: string; isBooked: boolean }>> }) => row.sections.flat())
        .find((seat: { id: string; isBooked: boolean }) => !seat.isBooked);

      const first = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/flights`,
        userId: seed.primaryUserId,
        body: {
          type: "outbound",
          offerToken: option.offerToken,
          seatNumber: firstAvailableSeat!.id,
        },
      });

      retrievePaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_created`,
        clientSecret: `${ctx.prefix}secret_reused`,
        status: "requires_payment_method",
        customerId: `${ctx.prefix}cus_reused`,
        metadata: {
          tripId: seed.draftTripId,
          bookingType: "flight",
          bookingId: first.body.booking.id,
        },
      });

      const second = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/flights`,
        userId: seed.primaryUserId,
        body: {
          type: "outbound",
          offerToken: option.offerToken,
          seatNumber: firstAvailableSeat!.id,
        },
      });

      expect(first.res.status).toBe(201);
      expect(second.res.status).toBe(200);
      expect(second.body.booking.id).toBe(first.body.booking.id);
      expect(second.body.paymentSession.id).toBe(first.body.paymentSession.id);
      expect(second.body.paymentSession.clientSecret).toBe(`${ctx.prefix}secret_reused`);
      expect(createPaymentIntentSpy).toHaveBeenCalledTimes(1);
    });

    it("rejects invalid or booked seats", async () => {
      createPaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_created`,
        clientSecret: `${ctx.prefix}secret_created`,
        status: "requires_payment_method",
        customerId: `${ctx.prefix}cus_created`,
        metadata: {},
      });

      const search = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=BOS&to=LHR&date=2026-10-15&cabinClass=economy&passengers=1",
        userId: seed.primaryUserId,
      });
      const option = search.body[0];
      const bookedSeat = option.seatMap
        .flatMap((row: { sections: Array<Array<{ id: string; isBooked: boolean }>> }) => row.sections.flat())
        .find((seat: { id: string; isBooked: boolean }) => seat.isBooked);

      const invalidSeatResponse = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/flights`,
        userId: seed.primaryUserId,
        body: {
          type: "outbound",
          offerToken: option.offerToken,
          seatNumber: "99Z",
        },
      });

      expect(invalidSeatResponse.res.status).toBe(400);

      if (bookedSeat) {
        const bookedSeatResponse = await requestJson({
          method: "POST",
          path: `/api/trips/${seed.draftTripId}/flights`,
          userId: seed.primaryUserId,
          body: {
            type: "outbound",
            offerToken: option.offerToken,
            seatNumber: bookedSeat.id,
          },
        });

        expect(bookedSeatResponse.res.status).toBe(400);
        expect(bookedSeatResponse.body.message).toContain("already been taken");
      }
    });

    it("lists, fetches, and cancels only the owner's bookings", async () => {
      const list = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/flights`,
        userId: seed.primaryUserId,
      });
      expect(list.res.status).toBe(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].departureTime).toEqual(expect.any(String));

      const detail = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });
      expect(detail.res.status).toBe(200);
      expect(Array.isArray(detail.body.seatMap)).toBe(true);

      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });
      expect(deleted.res.status).toBe(204);

      const bookingRows = await db
        .select({ status: flightBooking.status })
        .from(flightBooking)
        .where(eq(flightBooking.id, seed.primaryBookingId));
      expect(bookingRows[0]?.status).toBe("cancelled");
    });

    it("returns 404 for another user's trip or booking", async () => {
      const calls = await Promise.all([
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.secondaryTripId}/flights`,
          userId: seed.primaryUserId,
        }),
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.secondaryTripId}/flights/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.secondaryTripId}/flights/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
        }),
      ]);

      for (const call of calls) {
        expect(call.res.status).toBe(404);
        expect(call.body).toMatchObject({ error: "NotFound" });
      }

      const secondaryRows = await db
        .select()
        .from(flightBooking)
        .where(
          and(
            eq(flightBooking.id, seed.secondaryBookingId),
            eq(flightBooking.tripId, seed.secondaryTripId),
          ),
        );
      expect(secondaryRows).toHaveLength(1);
      expect(secondaryRows[0]?.status).not.toBe("cancelled");
    });

    it("keeps cancellation compatible when itinerary still exists", async () => {
      await db.insert(itinerary).values({
        id: `${ctx.prefix}draft_trip_itinerary`,
        tripId: seed.upcomingTripId,
      });

      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);
    });
  });
});
