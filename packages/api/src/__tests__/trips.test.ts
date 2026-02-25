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
import {
  airport,
  destination,
  flightBooking,
  hotel,
  hotelBooking,
  itinerary,
  itineraryActivity,
  itineraryDay,
  payment,
  trip,
  user,
} from "../db/schema";
import { tripRoutes } from "../routes/trips";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
  dateWithOffset,
  formatDate,
} from "./harness";

const ctx = createTestContext("trip");
const app = createTestApp().use(tripRoutes);
const request = createJsonRequester(app);
const requestJson = request.requestJson;
const authMock = createHeaderAuthMock(ctx.prefix);

type SeedData = {
  primaryUserId: string;
  secondaryUserId: string;
  destinationTokyoId: string;
  destinationParisId: string;
  destinationBaliId: string;
  hotelParisId: string;
  draftTripId: string;
  upcomingTripId: string;
  pastTripId: string;
  secondaryUserTripId: string;
  upcomingTripPaymentId: string;
  upcomingTripItineraryId: string;
};

let seed: SeedData;

const cleanupTripsFixtureData = async () => {
  await ctx.cleanup();
};

const seedTripsFixtureData = async () => {
  const baseTime = Date.parse("2025-01-01T00:00:00.000Z");
  const primaryUserId = `${ctx.prefix}user_primary`;
  const secondaryUserId = `${ctx.prefix}user_secondary`;

  const destinationTokyoId = `${ctx.prefix}dest_tokyo`;
  const destinationParisId = `${ctx.prefix}dest_paris`;
  const destinationBaliId = `${ctx.prefix}dest_bali`;
  const hotelParisId = `${ctx.prefix}hotel_paris`;

  const draftTripId = `${ctx.prefix}trip_draft`;
  const upcomingTripId = `${ctx.prefix}trip_upcoming`;
  const pastTripId = `${ctx.prefix}trip_past`;
  const secondaryUserTripId = `${ctx.prefix}trip_secondary`;

  const upcomingTripPaymentId = `${ctx.prefix}payment_upcoming`;
  const upcomingTripItineraryId = `${ctx.prefix}itinerary_upcoming`;

  const upcomingStartDate = dateWithOffset(45);
  const upcomingEndDate = dateWithOffset(52);
  const pastStartDate = dateWithOffset(-40);
  const pastEndDate = dateWithOffset(-33);

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
      code: "CDG",
      icao: "LFPG",
      name: "Paris Charles de Gaulle Airport",
      city: "Paris",
      countryCode: "TS",
      continent: "EU",
      timezone: "Europe/Paris",
      latitude: 49.0097,
      longitude: 2.5479,
      airportType: "large_airport",
      scheduledService: true,
    },
  ] as const;

  await Promise.all(
    requiredAirports.map((row) =>
      db.insert(airport).values(row).onConflictDoNothing(),
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

  await db.insert(destination).values([
    {
      id: destinationTokyoId,
      name: "TestTokyo",
      country: "Japan",
      countryCode: "JP",
      region: "East Asia",
      timezone: "Asia/Tokyo",
      imagesUrls: null,
      description: "Test destination Tokyo",
      highlights: ["culture", "food"],
      bestTimeToVisit: "March to May",
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
    },
    {
      id: destinationParisId,
      name: "TestParis",
      country: "France",
      countryCode: "FR",
      region: "Europe",
      timezone: "Europe/Paris",
      imagesUrls: null,
      description: "Test destination Paris",
      highlights: ["art", "culture"],
      bestTimeToVisit: "April to June",
      createdAt: new Date(baseTime + 1_000),
      updatedAt: new Date(baseTime + 1_000),
    },
    {
      id: destinationBaliId,
      name: "TestBali",
      country: "Indonesia",
      countryCode: "ID",
      region: "Southeast Asia",
      timezone: "Asia/Makassar",
      imagesUrls: null,
      description: "Test destination Bali",
      highlights: ["beaches", "relaxation"],
      bestTimeToVisit: "April to October",
      createdAt: new Date(baseTime + 2_000),
      updatedAt: new Date(baseTime + 2_000),
    },
  ]);

  await db.insert(hotel).values([
    {
      id: hotelParisId,
      destinationId: destinationParisId,
      name: "Paris Boutique Hotel",
      address: "10 Rue de Test, Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      imagesUrls: null,
      rating: 4,
      amenities: ["wifi", "restaurant"],
      priceRange: "upscale",
      avgPricePerNightInCents: 26_000,
      description: "Paris test hotel",
      createdAt: new Date(baseTime + 3_000),
      updatedAt: new Date(baseTime + 3_000),
    },
  ]);

  await db.insert(trip).values([
    {
      id: draftTripId,
      userId: primaryUserId,
      destinationId: destinationTokyoId,
      title: "Draft Winter Planning",
      startDate: null,
      endDate: null,
      createdAt: new Date(baseTime + 4_000),
      updatedAt: new Date(baseTime + 4_000),
    },
    {
      id: upcomingTripId,
      userId: primaryUserId,
      destinationId: destinationParisId,
      title: "Upcoming Paris Adventure",
      startDate: upcomingStartDate,
      endDate: upcomingEndDate,
      createdAt: new Date(baseTime + 5_000),
      updatedAt: new Date(baseTime + 5_000),
    },
    {
      id: pastTripId,
      userId: primaryUserId,
      destinationId: destinationBaliId,
      title: "Past Bali Escape",
      startDate: pastStartDate,
      endDate: pastEndDate,
      createdAt: new Date(baseTime + 6_000),
      updatedAt: new Date(baseTime + 6_000),
    },
    {
      id: secondaryUserTripId,
      userId: secondaryUserId,
      destinationId: destinationTokyoId,
      title: "Secondary User Trip",
      startDate: dateWithOffset(14),
      endDate: dateWithOffset(20),
      createdAt: new Date(baseTime + 7_000),
      updatedAt: new Date(baseTime + 7_000),
    },
  ]);

  await db.insert(payment).values({
    id: upcomingTripPaymentId,
    tripId: upcomingTripId,
    stripePaymentIntentId: `${ctx.prefix}pi_upcoming`,
    stripeCustomerId: `${ctx.prefix}cus_upcoming`,
    amountInCents: 152_300,
    currency: "usd",
    status: "succeeded",
    description: "Trip booking payment",
    refundedAmountInCents: 0,
    metadata: JSON.stringify({ source: "test" }),
    createdAt: new Date(baseTime + 8_000),
    updatedAt: new Date(baseTime + 8_000),
  });

  await db.insert(flightBooking).values({
    id: `${ctx.prefix}flight_upcoming`,
    tripId: upcomingTripId,
    paymentId: upcomingTripPaymentId,
    type: "outbound",
    flightNumber: "TL100",
    airline: "Trip Loom Air",
    departureAirportCode: "JFK",
    departureCity: "New York",
    departureTime: new Date("2026-06-15T13:00:00.000Z"),
    arrivalAirportCode: "CDG",
    arrivalCity: "Paris",
    arrivalTime: new Date("2026-06-15T22:00:00.000Z"),
    durationMinutes: 540,
    seatNumber: "12A",
    cabinClass: "economy",
    priceInCents: 58_000,
    status: "confirmed",
    createdAt: new Date(baseTime + 9_000),
    updatedAt: new Date(baseTime + 9_000),
  });

  await db.insert(hotelBooking).values({
    id: `${ctx.prefix}hotel_booking_upcoming`,
    tripId: upcomingTripId,
    hotelId: hotelParisId,
    paymentId: upcomingTripPaymentId,
    checkInDate: upcomingStartDate,
    checkOutDate: upcomingEndDate,
    roomType: "deluxe",
    numberOfNights: 7,
    pricePerNightInCents: 20_000,
    totalPriceInCents: 140_000,
    status: "confirmed",
    createdAt: new Date(baseTime + 10_000),
    updatedAt: new Date(baseTime + 10_000),
  });

  await db.insert(itinerary).values({
    id: upcomingTripItineraryId,
    tripId: upcomingTripId,
    createdAt: new Date(baseTime + 11_000),
    updatedAt: new Date(baseTime + 11_000),
  });

  // Add itinerary for past trip so it computes to 'past' status
  await db.insert(itinerary).values({
    id: `${ctx.prefix}itinerary_past`,
    tripId: pastTripId,
    createdAt: new Date(baseTime + 11_500),
    updatedAt: new Date(baseTime + 11_500),
  });

  const itineraryDayOneId = `${ctx.prefix}itinerary_day_1`;
  const itineraryDayTwoId = `${ctx.prefix}itinerary_day_2`;

  await db.insert(itineraryDay).values([
    {
      id: itineraryDayOneId,
      itineraryId: upcomingTripItineraryId,
      dayNumber: 1,
      date: upcomingStartDate,
      title: "Arrival day",
      notes: "Light schedule",
      createdAt: new Date(baseTime + 12_000),
      updatedAt: new Date(baseTime + 12_000),
    },
    {
      id: itineraryDayTwoId,
      itineraryId: upcomingTripItineraryId,
      dayNumber: 2,
      date: dateWithOffset(46),
      title: "Museum day",
      notes: "City center activities",
      createdAt: new Date(baseTime + 13_000),
      updatedAt: new Date(baseTime + 13_000),
    },
  ]);

  await db.insert(itineraryActivity).values([
    {
      id: `${ctx.prefix}activity_1`,
      itineraryDayId: itineraryDayOneId,
      orderIndex: 0,
      title: "Hotel check-in",
      description: "Settle in and rest",
      startTime: "15:00",
      endTime: "16:00",
      location: "Paris Boutique Hotel",
      locationUrl: null,
      estimatedCostInCents: 0,
      createdAt: new Date(baseTime + 14_000),
      updatedAt: new Date(baseTime + 14_000),
    },
    {
      id: `${ctx.prefix}activity_2`,
      itineraryDayId: itineraryDayTwoId,
      orderIndex: 0,
      title: "Louvre Museum",
      description: "Morning museum visit",
      startTime: "09:00",
      endTime: "12:00",
      location: "Louvre",
      locationUrl: null,
      estimatedCostInCents: 2_500,
      createdAt: new Date(baseTime + 15_000),
      updatedAt: new Date(baseTime + 15_000),
    },
  ]);

  seed = {
    primaryUserId,
    secondaryUserId,
    destinationTokyoId,
    destinationParisId,
    destinationBaliId,
    hotelParisId,
    draftTripId,
    upcomingTripId,
    pastTripId,
    secondaryUserTripId,
    upcomingTripPaymentId,
    upcomingTripItineraryId,
  };
};

describe("Trips API", () => {
  beforeAll(async () => {
    authMock.enable();
  });

  beforeEach(async () => {
    await cleanupTripsFixtureData();
    await seedTripsFixtureData();
  });

  afterAll(async () => {
    await cleanupTripsFixtureData();
    authMock.restore();
  });

  it("all trips endpoints return 401 without auth", async () => {
    const calls = await Promise.all([
      requestJson({
        method: "GET",
        path: "/api/trips",
      }),
      requestJson({
        method: "GET",
        path: `/api/trips/${seed.draftTripId}`,
      }),
      requestJson({
        method: "POST",
        path: "/api/trips",
        body: { title: "Unauthorized create attempt" },
      }),
      requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.draftTripId}`,
        body: { title: "Unauthorized patch attempt" },
      }),
      requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.draftTripId}`,
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

  it("GET /api/trips returns only authenticated user's trips", async () => {
    const { res, body } = await requestJson({
      method: "GET",
      path: "/api/trips",
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(3);

    const ids = body.data.map((row: { id: string }) => row.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        seed.draftTripId,
        seed.upcomingTripId,
        seed.pastTripId,
      ]),
    );
    expect(ids).not.toContain(seed.secondaryUserTripId);

    const rows = body.data as Array<{
      id: string;
      hasFlights: boolean;
      hasHotel: boolean;
      hasItinerary: boolean;
    }>;

    const upcomingRow = rows.find((row) => row.id === seed.upcomingTripId);
    const draftRow = rows.find((row) => row.id === seed.draftTripId);

    expect(upcomingRow?.hasFlights).toBe(true);
    expect(upcomingRow?.hasHotel).toBe(true);
    expect(upcomingRow?.hasItinerary).toBe(true);
    expect(draftRow?.hasFlights).toBe(false);
    expect(draftRow?.hasHotel).toBe(false);
    expect(draftRow?.hasItinerary).toBe(false);
  });

  it("GET /api/trips supports status filtering with single status", async () => {
    const { res, body } = await requestJson({
      method: "GET",
      path: "/api/trips?status=draft",
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(seed.draftTripId);
    expect(body.data[0].status).toBe("draft");
  });

  it("GET /api/trips supports multiple status filtering", async () => {
    const { res, body } = await requestJson({
      method: "GET",
      path: "/api/trips?status=draft&status=upcoming",
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);

    const statuses = body.data.map((row: { status: string }) => row.status);
    expect(statuses).toContain("draft");
    expect(statuses).toContain("upcoming");
    expect(statuses).not.toContain("past");

    const ids = body.data.map((row: { id: string }) => row.id);
    expect(ids).toContain(seed.draftTripId);
    expect(ids).toContain(seed.upcomingTripId);
    expect(ids).not.toContain(seed.pastTripId);
  });

  it("GET /api/trips rejects invalid status value", async () => {
    const { res } = await requestJson({
      method: "GET",
      path: "/api/trips?status=doesnt-exist",
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(422);
  });

  it("GET /api/trips rejects when any status value is invalid", async () => {
    const { res } = await requestJson({
      method: "GET",
      path: "/api/trips?status=upcoming&status=not-real",
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(422);
  });

  it("GET /api/trips paginates correctly", async () => {
    const firstPage = await requestJson({
      method: "GET",
      path: "/api/trips?limit=2",
      userId: seed.primaryUserId,
    });

    expect(firstPage.res.status).toBe(200);
    expect(firstPage.body.data).toHaveLength(2);
    expect(firstPage.body.hasMore).toBe(true);
    expect(firstPage.body.nextCursor).toBeTruthy();

    const secondPage = await requestJson({
      method: "GET",
      path: `/api/trips?limit=2&cursor=${firstPage.body.nextCursor}`,
      userId: seed.primaryUserId,
    });

    expect(secondPage.res.status).toBe(200);
    expect(secondPage.body.data).toHaveLength(1);
    expect(secondPage.body.hasMore).toBe(false);
    expect(secondPage.body.nextCursor).toBeNull();

    const firstIds = firstPage.body.data.map((row: { id: string }) => row.id);
    const secondIds = secondPage.body.data.map((row: { id: string }) => row.id);
    const overlap = firstIds.filter((id: string) => secondIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it("GET /api/trips/:id returns trip with bookings, itinerary and payments", async () => {
    const { res, body } = await requestJson({
      method: "GET",
      path: `/api/trips/${seed.upcomingTripId}`,
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(200);
    expect(body.id).toBe(seed.upcomingTripId);
    expect(body.destination?.id).toBe(seed.destinationParisId);
    expect(body.flightBookings).toHaveLength(1);
    expect(body.hotelBookings).toHaveLength(1);
    expect(body.hotelBookings[0].hotel.id).toBe(seed.hotelParisId);
    expect(body.payments).toHaveLength(1);
    expect(body.payments[0].id).toBe(seed.upcomingTripPaymentId);
    expect(body.destination?.imagesUrls).toBeNull();
    expect(body.hasFlights).toBe(true);
    expect(body.hasHotel).toBe(true);
    expect(body.hasItinerary).toBe(true);
    expect(body.itinerary).not.toBeNull();
    expect(body.itinerary.id).toBe(seed.upcomingTripItineraryId);
    expect(body.itinerary.days).toHaveLength(2);
    expect(body.itinerary.days[0].activities.length).toBeGreaterThan(0);
  });

  it("GET /api/trips/:id returns 404 for another user's trip", async () => {
    const { res, body } = await requestJson({
      method: "GET",
      path: `/api/trips/${seed.secondaryUserTripId}`,
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not Found");
    expect(body.message).toBe("Trip not found");
  });

  it("POST /api/trips creates a draft trip", async () => {
    const { res, body } = await requestJson({
      method: "POST",
      path: "/api/trips",
      userId: seed.primaryUserId,
      body: {
        title: "Brand New Draft",
      },
    });

    expect(res.status).toBe(201);
    expect(body.userId).toBe(seed.primaryUserId);
    expect(body.status).toBe("draft");
    expect(body.title).toBe("Brand New Draft");
    expect(body.destination).toBeNull();
    expect(body.hasFlights).toBe(false);
    expect(body.hasHotel).toBe(false);
    expect(body.hasItinerary).toBe(false);
  });

  it("POST /api/trips with destinationId links destination", async () => {
    const { res, body } = await requestJson({
      method: "POST",
      path: "/api/trips",
      userId: seed.primaryUserId,
      body: {
        title: "Destination linked",
        destinationId: seed.destinationTokyoId,
      },
    });

    expect(res.status).toBe(201);
    expect(body.destinationId).toBe(seed.destinationTokyoId);
    expect(body.destination.id).toBe(seed.destinationTokyoId);
    expect(body.destination.name).toBe("TestTokyo");
  });

  it("PATCH /api/trips/:id updates trip fields", async () => {
    const { res, body } = await requestJson({
      method: "PATCH",
      path: `/api/trips/${seed.draftTripId}`,
      userId: seed.primaryUserId,
      body: {
        title: "Updated draft title",
        destinationId: seed.destinationBaliId,
      },
    });

    expect(res.status).toBe(200);
    expect(body.id).toBe(seed.draftTripId);
    expect(body.title).toBe("Updated draft title");
    expect(body.destinationId).toBe(seed.destinationBaliId);
    expect(body.destination.id).toBe(seed.destinationBaliId);
  });

  it("PATCH /api/trips/:id handles status transition from draft to upcoming", async () => {
    await db.insert(itinerary).values({
      id: `${ctx.prefix}draft_itinerary`,
      tripId: seed.draftTripId,
    });

    const startDate = dateWithOffset(20);
    const endDate = dateWithOffset(27);
    const { res, body } = await requestJson({
      method: "PATCH",
      path: `/api/trips/${seed.draftTripId}`,
      userId: seed.primaryUserId,
      body: {
        startDate,
        endDate,
      },
    });

    expect(res.status).toBe(200);
    expect(body.startDate).toBe(startDate);
    expect(body.endDate).toBe(endDate);
    expect(body.status).toBe("upcoming");
  });

  it("DELETE /api/trips/:id hard deletes trip and related rows", async () => {
    const { res } = await requestJson({
      method: "DELETE",
      path: `/api/trips/${seed.upcomingTripId}`,
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(204);

    const tripRows = await db
      .select()
      .from(trip)
      .where(eq(trip.id, seed.upcomingTripId));
    expect(tripRows).toHaveLength(0);

    const flightRows = await db
      .select()
      .from(flightBooking)
      .where(eq(flightBooking.tripId, seed.upcomingTripId));
    expect(flightRows).toHaveLength(0);

    const hotelBookingRows = await db
      .select()
      .from(hotelBooking)
      .where(eq(hotelBooking.tripId, seed.upcomingTripId));
    expect(hotelBookingRows).toHaveLength(0);

    const itineraryRows = await db
      .select()
      .from(itinerary)
      .where(eq(itinerary.tripId, seed.upcomingTripId));
    expect(itineraryRows).toHaveLength(0);

    const paymentRows = await db
      .select()
      .from(payment)
      .where(eq(payment.tripId, seed.upcomingTripId));
    expect(paymentRows).toHaveLength(0);
  });

  it("DELETE /api/trips/:id returns 404 for another user's trip", async () => {
    const { res, body } = await requestJson({
      method: "DELETE",
      path: `/api/trips/${seed.secondaryUserTripId}`,
      userId: seed.primaryUserId,
    });

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not Found");
    expect(body.message).toBe("Trip not found");

    const secondaryTripRows = await db
      .select()
      .from(trip)
      .where(
        and(
          eq(trip.id, seed.secondaryUserTripId),
          eq(trip.userId, seed.secondaryUserId),
        ),
      );
    expect(secondaryTripRows).toHaveLength(1);
  });
});
