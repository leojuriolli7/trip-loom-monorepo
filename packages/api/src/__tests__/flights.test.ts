import { and, eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../db";
import { airport, flightBooking, itinerary, trip, user } from "../db/schema";
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

const getMinimumAvailableSeatPriceInCents = (option: {
  seatMap: Array<{
    sections: Array<
      Array<{
        priceInCents: number;
        isBooked: boolean;
      }>
    >;
  }>;
}): number => {
  let minimumPrice = Number.POSITIVE_INFINITY;

  for (const row of option.seatMap) {
    for (const section of row.sections) {
      for (const seat of section) {
        if (seat.isBooked) {
          continue;
        }

        minimumPrice = Math.min(minimumPrice, seat.priceInCents);
      }
    }
  }

  return Number.isFinite(minimumPrice) ? minimumPrice : 0;
};

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
    {
      code: "SFO",
      icao: "KSFO",
      name: "San Francisco International Airport",
      city: "San Francisco",
      countryCode: "TS",
      continent: "NA",
      timezone: "America/Los_Angeles",
      latitude: 37.6213,
      longitude: -122.379,
      airportType: "large_airport",
      scheduledService: true,
    },
    {
      code: "NRT",
      icao: "RJAA",
      name: "Narita International Airport",
      city: "Tokyo",
      countryCode: "TS",
      continent: "AS",
      timezone: "Asia/Tokyo",
      latitude: 35.772,
      longitude: 140.3929,
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
      status: "draft",
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
      status: "upcoming",
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
      status: "upcoming",
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
  });

  afterAll(async () => {
    await cleanupFlightsFixtureData();
    authMock.restore();
  });

  describe("GET /api/flights/search", () => {
    it("generates deterministic flight options with seat maps", async () => {
      const path =
        "/api/flights/search?from=JFK&to=LAX&date=2026-09-20&cabinClass=economy&passengers=2";

      const first = await requestJson({
        method: "GET",
        path,
        userId: seed.primaryUserId,
      });
      const second = await requestJson({
        method: "GET",
        path,
        userId: seed.primaryUserId,
      });

      expect(first.res.status).toBe(200);
      expect(second.res.status).toBe(200);
      expect(first.body).toEqual(second.body);
      expect(first.body.length).toBeGreaterThanOrEqual(5);
      expect(first.body.length).toBeLessThanOrEqual(10);

      const minimumSeatPrices = first.body.map(getMinimumAvailableSeatPriceInCents);
      const sortedMinimumSeatPrices = [...minimumSeatPrices].sort((a, b) => a - b);
      expect(minimumSeatPrices).toEqual(sortedMinimumSeatPrices);

      const firstOption = first.body[0];
      expect(firstOption).toMatchObject({
        departureAirportCode: "JFK",
        arrivalAirportCode: "LAX",
        cabinClass: "economy",
        departureCity: "New York",
        arrivalCity: "Los Angeles",
        departureAirport: {
          code: "JFK",
        },
        arrivalAirport: {
          code: "LAX",
        },
      });

      expect(Array.isArray(firstOption.seatMap)).toBe(true);
      expect(firstOption.seatMap.length).toBeGreaterThan(0);
      expect(firstOption.seatMap[0].sections.length).toBeGreaterThan(0);
      expect(firstOption.seatMap[0].sections[0][0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          priceInCents: expect.any(Number),
          isBooked: expect.any(Boolean),
        }),
      );
      expect(firstOption.seatMap[0].sections[0][0].priceInCents).toBeGreaterThanOrEqual(
        7_500,
      );

      const availableSeatIds = firstOption.seatMap.flatMap(
        (row: {
          sections: Array<
            Array<{
              id: string;
              isBooked: boolean;
            }>
          >;
        }) =>
          row.sections.flatMap((section) =>
            section.filter((seat) => !seat.isBooked).map((seat) => seat.id),
          ),
      );

      if (firstOption.suggestedSeatId) {
        expect(availableSeatIds).toContain(firstOption.suggestedSeatId);
      }

      expect(firstOption.availableSeats).toBe(availableSeatIds.length);
    });

    it("applies cabin class pricing multipliers", async () => {
      const economy = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=JFK&to=LAX&date=2026-09-20&cabinClass=economy&passengers=1",
        userId: seed.primaryUserId,
      });
      const firstClass = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=JFK&to=LAX&date=2026-09-20&cabinClass=first&passengers=1",
        userId: seed.primaryUserId,
      });

      expect(economy.res.status).toBe(200);
      expect(firstClass.res.status).toBe(200);

      const economyMinPrice = Math.min(
        ...economy.body.map(getMinimumAvailableSeatPriceInCents),
      );
      const firstMinPrice = Math.min(
        ...firstClass.body.map(getMinimumAvailableSeatPriceInCents),
      );

      expect(firstMinPrice).toBeGreaterThan(economyMinPrice);
    });

    it("validates airport query params", async () => {
      const { res } = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=JF&to=LAX&date=2026-09-20",
        userId: seed.primaryUserId,
      });

      expect([400, 422]).toContain(res.status);
    });

    it("returns 400 when airport code does not exist in DB", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: "/api/flights/search?from=ZZZ&to=LAX&date=2026-09-20",
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(400);
      expect(body).toMatchObject({
        error: "Bad Request",
      });
      expect(body.message).toContain("ZZZ");
    });
  });

  describe("Booking CRUD", () => {
    it("all booking endpoints return 401 without auth", async () => {
      const calls = await Promise.all([
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.upcomingTripId}/flights`,
        }),
        requestJson({
          method: "POST",
          path: `/api/trips/${seed.upcomingTripId}/flights`,
          body: {
            type: "outbound",
            flightNumber: "TL777",
            airline: "TripLoom Airways",
            departureAirportCode: "JFK",
            departureCity: "New York",
            departureTime: "2026-09-22T10:00:00.000Z",
            arrivalAirportCode: "LAX",
            arrivalCity: "Los Angeles",
            arrivalTime: "2026-09-22T16:00:00.000Z",
            durationMinutes: 360,
            cabinClass: "economy",
            priceInCents: 45_000,
          },
        }),
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        }),
        requestJson({
          method: "PATCH",
          path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
          body: { seatNumber: "14C" },
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

    it("POST creates a booking and can transition draft trip status", async () => {
      const create = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/flights`,
        userId: seed.primaryUserId,
        body: {
          type: "outbound",
          flightNumber: "GA901",
          airline: "Global Air",
          departureAirportCode: "BOS",
          departureCity: "Boston",
          departureTime: "2026-10-10T09:15:00.000Z",
          arrivalAirportCode: "LHR",
          arrivalCity: "London",
          arrivalTime: "2026-10-10T15:45:00.000Z",
          durationMinutes: 390,
          cabinClass: "economy",
          priceInCents: 38_500,
          seatNumber: "10B",
        },
      });

      expect(create.res.status).toBe(201);
      expect(create.body.tripId).toBe(seed.draftTripId);
      expect(create.body.status).toBe("pending");
      expect(create.body.seatNumber).toBe("10B");

      const storedRows = await db
        .select()
        .from(flightBooking)
        .where(eq(flightBooking.id, create.body.id));
      expect(storedRows).toHaveLength(1);

      const draftTripRows = await db
        .select({ status: trip.status })
        .from(trip)
        .where(eq(trip.id, seed.draftTripId));
      expect(draftTripRows[0]?.status).toBe("upcoming");
    });

    it("GET /api/trips/:id/flights lists only trip bookings", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/flights`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe(seed.primaryBookingId);
      expect(body[0].tripId).toBe(seed.upcomingTripId);
    });

    it("GET /api/trips/:id/flights/:flightId returns booking detail with seat map", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body.id).toBe(seed.primaryBookingId);
      expect(Array.isArray(body.seatMap)).toBe(true);
      expect(body.seatMap.length).toBeGreaterThan(0);
      expect(body.seatMap[0].sections.length).toBeGreaterThan(0);
      expect(body.suggestedSeatId === null || typeof body.suggestedSeatId === "string").toBe(true);
    });

    it("PATCH updates booking seat/status", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/flights/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: {
          seatNumber: "14C",
          status: "pending",
        },
      });

      expect(res.status).toBe(200);
      expect(body.id).toBe(seed.primaryBookingId);
      expect(body.seatNumber).toBe("14C");
      expect(body.status).toBe("pending");

      const rows = await db
        .select({
          seatNumber: flightBooking.seatNumber,
          status: flightBooking.status,
        })
        .from(flightBooking)
        .where(eq(flightBooking.id, seed.primaryBookingId));
      expect(rows[0]?.seatNumber).toBe("14C");
      expect(rows[0]?.status).toBe("pending");
    });

    it("DELETE cancels booking and may move trip back to draft", async () => {
      const created = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/flights`,
        userId: seed.primaryUserId,
        body: {
          type: "outbound",
          flightNumber: "PA112",
          airline: "Pacific Airlines",
          departureAirportCode: "SFO",
          departureCity: "San Francisco",
          departureTime: "2026-11-01T08:00:00.000Z",
          arrivalAirportCode: "NRT",
          arrivalCity: "Tokyo",
          arrivalTime: "2026-11-01T19:20:00.000Z",
          durationMinutes: 680,
          cabinClass: "economy",
          priceInCents: 62_000,
          seatNumber: "9A",
        },
      });
      expect(created.res.status).toBe(201);

      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.draftTripId}/flights/${created.body.id}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);

      const bookingRows = await db
        .select({ status: flightBooking.status })
        .from(flightBooking)
        .where(eq(flightBooking.id, created.body.id));
      expect(bookingRows[0]?.status).toBe("cancelled");

      const tripRows = await db
        .select({ status: trip.status })
        .from(trip)
        .where(eq(trip.id, seed.draftTripId));
      expect(tripRows[0]?.status).toBe("draft");
    });

    it("DELETE keeps trip upcoming when itinerary still exists", async () => {
      const created = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/flights`,
        userId: seed.primaryUserId,
        body: {
          type: "outbound",
          flightNumber: "NO221",
          airline: "North Orbit",
          departureAirportCode: "JFK",
          departureCity: "New York",
          departureTime: "2026-10-12T12:00:00.000Z",
          arrivalAirportCode: "LAX",
          arrivalCity: "Los Angeles",
          arrivalTime: "2026-10-12T18:05:00.000Z",
          durationMinutes: 365,
          cabinClass: "economy",
          priceInCents: 41_000,
        },
      });
      expect(created.res.status).toBe(201);

      await db.insert(itinerary).values({
        id: `${ctx.prefix}draft_trip_itinerary`,
        tripId: seed.draftTripId,
      });

      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.draftTripId}/flights/${created.body.id}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);

      const tripRows = await db
        .select({ status: trip.status })
        .from(trip)
        .where(eq(trip.id, seed.draftTripId));
      expect(tripRows[0]?.status).toBe("upcoming");
    });

    it("cannot access another user's trip bookings", async () => {
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
          method: "PATCH",
          path: `/api/trips/${seed.secondaryTripId}/flights/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
          body: {
            seatNumber: "1A",
          },
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.secondaryTripId}/flights/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
        }),
      ]);

      for (const call of calls) {
        expect(call.res.status).toBe(404);
        expect(call.body).toMatchObject({
          error: "Not Found",
        });
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
  });
});
