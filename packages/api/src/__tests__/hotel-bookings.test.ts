import { and, eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { db } from "../db";
import {
  destination,
  flightBooking,
  hotel,
  hotelBooking,
  itinerary,
  trip,
  user,
} from "../db/schema";
import { hotelBookingRoutes } from "../routes/hotel-bookings";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
  dateWithOffset,
} from "./harness";

const ctx = createTestContext("hotel_booking");
const app = createTestApp().use(hotelBookingRoutes);
const request = createJsonRequester(app);
const requestJson = request.requestJson;
const authMock = createHeaderAuthMock(ctx.prefix);

type SeedData = {
  primaryUserId: string;
  secondaryUserId: string;
  draftTripId: string;
  upcomingTripId: string;
  secondaryTripId: string;
  destinationId: string;
  hotelId: string;
  secondaryHotelId: string;
  primaryBookingId: string;
  secondaryBookingId: string;
};

let seed: SeedData;

const cleanupFixtureData = async () => {
  await ctx.cleanup();
};

const seedFixtureData = async () => {
  const baseTime = Date.parse("2025-06-01T00:00:00.000Z");
  const primaryUserId = `${ctx.prefix}user_primary`;
  const secondaryUserId = `${ctx.prefix}user_secondary`;

  const draftTripId = `${ctx.prefix}trip_draft`;
  const upcomingTripId = `${ctx.prefix}trip_upcoming`;
  const secondaryTripId = `${ctx.prefix}trip_secondary`;

  const destinationId = `${ctx.prefix}destination`;
  const hotelId = `${ctx.prefix}hotel_main`;
  const secondaryHotelId = `${ctx.prefix}hotel_secondary`;

  const primaryBookingId = `${ctx.prefix}booking_primary`;
  const secondaryBookingId = `${ctx.prefix}booking_secondary`;

  // Create destination
  await db.insert(destination).values({
    id: destinationId,
    name: "Test City",
    country: "Test Country",
    countryCode: "TC",
    timezone: "UTC",
    createdAt: new Date(baseTime),
    updatedAt: new Date(baseTime),
  });

  // Create hotels
  await db.insert(hotel).values([
    {
      id: hotelId,
      destinationId,
      name: "Grand Test Hotel",
      address: "123 Test Street",
      rating: 4,
      amenities: ["wifi", "pool"],
      priceRange: "moderate",
      avgPricePerNightInCents: 15000,
      createdAt: new Date(baseTime + 1_000),
      updatedAt: new Date(baseTime + 1_000),
    },
    {
      id: secondaryHotelId,
      destinationId,
      name: "Budget Test Inn",
      address: "456 Test Avenue",
      rating: 3,
      amenities: ["wifi"],
      priceRange: "budget",
      avgPricePerNightInCents: 8000,
      createdAt: new Date(baseTime + 2_000),
      updatedAt: new Date(baseTime + 2_000),
    },
  ]);

  // Create users
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

  // Create trips
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

  // Create hotel bookings
  await db.insert(hotelBooking).values([
    {
      id: primaryBookingId,
      tripId: upcomingTripId,
      hotelId,
      paymentId: null,
      checkInDate: dateWithOffset(40),
      checkOutDate: dateWithOffset(43),
      roomType: "king",
      numberOfNights: 3,
      pricePerNightInCents: 15000,
      totalPriceInCents: 45000,
      status: "confirmed",
      createdAt: new Date(baseTime + 3_000),
      updatedAt: new Date(baseTime + 3_000),
    },
    {
      id: secondaryBookingId,
      tripId: secondaryTripId,
      hotelId: secondaryHotelId,
      paymentId: null,
      checkInDate: dateWithOffset(18),
      checkOutDate: dateWithOffset(21),
      roomType: "double",
      numberOfNights: 3,
      pricePerNightInCents: 8000,
      totalPriceInCents: 24000,
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
    destinationId,
    hotelId,
    secondaryHotelId,
    primaryBookingId,
    secondaryBookingId,
  };
};

describe("Hotel Bookings API", () => {
  beforeAll(async () => {
    authMock.enable();
  });

  beforeEach(async () => {
    await cleanupFixtureData();
    await seedFixtureData();
  });

  afterAll(async () => {
    await cleanupFixtureData();
    authMock.restore();
  });

  describe("Authentication", () => {
    it("all booking endpoints return 401 without auth", async () => {
      const calls = await Promise.all([
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.upcomingTripId}/hotels`,
        }),
        requestJson({
          method: "POST",
          path: `/api/trips/${seed.upcomingTripId}/hotels`,
          body: {
            hotelId: seed.hotelId,
            checkInDate: dateWithOffset(50),
            checkOutDate: dateWithOffset(53),
            roomType: "standard",
          },
        }),
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        }),
        requestJson({
          method: "PATCH",
          path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
          body: { roomType: "suite" },
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
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
  });

  describe("Ownership Boundaries", () => {
    it("cannot access another user's trip bookings", async () => {
      const calls = await Promise.all([
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.secondaryTripId}/hotels`,
          userId: seed.primaryUserId,
        }),
        requestJson({
          method: "GET",
          path: `/api/trips/${seed.secondaryTripId}/hotels/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
        }),
        requestJson({
          method: "PATCH",
          path: `/api/trips/${seed.secondaryTripId}/hotels/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
          body: { roomType: "suite" },
        }),
        requestJson({
          method: "DELETE",
          path: `/api/trips/${seed.secondaryTripId}/hotels/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
        }),
      ]);

      for (const call of calls) {
        expect(call.res.status).toBe(404);
        expect(call.body).toMatchObject({
          error: "Not Found",
        });
      }

      // Verify booking was not affected
      const secondaryRows = await db
        .select()
        .from(hotelBooking)
        .where(
          and(
            eq(hotelBooking.id, seed.secondaryBookingId),
            eq(hotelBooking.tripId, seed.secondaryTripId),
          ),
        );
      expect(secondaryRows).toHaveLength(1);
      expect(secondaryRows[0]?.status).not.toBe("cancelled");
    });
  });

  describe("POST /api/trips/:id/hotels", () => {
    it("creates a booking and generates price based on hotel priceRange", async () => {
      const checkInDate = dateWithOffset(50);
      const checkOutDate = dateWithOffset(55); // 5 nights

      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId, // "moderate" priceRange hotel
          checkInDate,
          checkOutDate,
          roomType: "suite",
        },
      });

      expect(res.status).toBe(201);
      expect(body.tripId).toBe(seed.draftTripId);
      expect(body.hotelId).toBe(seed.hotelId);
      expect(body.checkInDate).toBe(checkInDate);
      expect(body.checkOutDate).toBe(checkOutDate);
      expect(body.roomType).toBe("suite");
      expect(body.numberOfNights).toBe(5);
      expect(body.status).toBe("pending");

      // Price should be generated within moderate range bounds ($100-$180)
      // with suite multiplier (2.0x), so $200-$360
      expect(body.pricePerNightInCents).toBeGreaterThanOrEqual(20000);
      expect(body.pricePerNightInCents).toBeLessThanOrEqual(36000);
      expect(body.totalPriceInCents).toBe(5 * body.pricePerNightInCents);

      // Verify hotel info is embedded
      expect(body.hotel).toMatchObject({
        id: seed.hotelId,
        name: "Grand Test Hotel",
        address: "123 Test Street",
        rating: 4,
      });

      // Verify stored in DB
      const storedRows = await db
        .select()
        .from(hotelBooking)
        .where(eq(hotelBooking.id, body.id));
      expect(storedRows).toHaveLength(1);
    });

    it("generates price within budget range for budget hotels", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.secondaryHotelId, // "budget" priceRange hotel
          checkInDate: dateWithOffset(50),
          checkOutDate: dateWithOffset(53), // 3 nights
          roomType: "standard",
        },
      });

      expect(res.status).toBe(201);
      // Price should be within budget range bounds ($40-$80)
      expect(body.pricePerNightInCents).toBeGreaterThanOrEqual(4000);
      expect(body.pricePerNightInCents).toBeLessThanOrEqual(8000);
      expect(body.totalPriceInCents).toBe(3 * body.pricePerNightInCents);
    });

    it("transitions trip from draft to upcoming when first booking is added", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(31),
          checkOutDate: dateWithOffset(34),
          roomType: "standard",
        },
      });

      expect(res.status).toBe(201);
      expect(body.tripId).toBe(seed.draftTripId);
    });

    it("returns 404 for invalid hotelId", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: "nonexistent_hotel_id",
          checkInDate: dateWithOffset(50),
          checkOutDate: dateWithOffset(53),
          roomType: "standard",
        },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "Not Found",
        message: "Hotel not found",
      });
    });

    it("returns 400 for invalid date range (checkOutDate <= checkInDate)", async () => {
      const sameDay = dateWithOffset(50);

      const { res } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: sameDay,
          checkOutDate: sameDay, // Same day = invalid
          roomType: "standard",
        },
      });

      expect([400, 422]).toContain(res.status);

      // Also test checkout before checkin
      const { res: res2 } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(55),
          checkOutDate: dateWithOffset(50), // Before checkin
          roomType: "standard",
        },
      });

      expect([400, 422]).toContain(res2.status);
    });

    it("returns 404 for non-existent trip", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/nonexistent_trip_id/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(50),
          checkOutDate: dateWithOffset(53),
          roomType: "standard",
        },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "Not Found",
        message: "Trip not found",
      });
    });
  });

  describe("GET /api/trips/:id/hotels", () => {
    it("lists bookings with hotel info", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/hotels`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe(seed.primaryBookingId);
      expect(body[0].tripId).toBe(seed.upcomingTripId);
      expect(body[0].hotel).toMatchObject({
        id: seed.hotelId,
        name: "Grand Test Hotel",
      });
    });

    it("returns empty array for trip with no bookings", async () => {
      // Create a trip with no hotel bookings
      const emptyTripId = `${ctx.prefix}trip_empty`;
      await db.insert(trip).values({
        id: emptyTripId,
        userId: seed.primaryUserId,
        title: "Empty Trip",
      });

      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${emptyTripId}/hotels`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe("GET /api/trips/:id/hotels/:hotelBookingId", () => {
    it("returns booking with hotel info", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body.id).toBe(seed.primaryBookingId);
      expect(body.tripId).toBe(seed.upcomingTripId);
      expect(body.roomType).toBe("king");
      expect(body.numberOfNights).toBe(3);
      expect(body.hotel).toMatchObject({
        id: seed.hotelId,
        name: "Grand Test Hotel",
        address: "123 Test Street",
        rating: 4,
      });
    });

    it("returns 404 for non-existent booking", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/hotels/nonexistent_booking`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "Not Found",
        message: "Hotel booking not found",
      });
    });
  });

  describe("PATCH /api/trips/:id/hotels/:hotelBookingId", () => {
    it("updates booking and recalculates totals when dates change", async () => {
      const newCheckIn = dateWithOffset(42);
      const newCheckOut = dateWithOffset(47); // 5 nights instead of 3

      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: {
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
        },
      });

      expect(res.status).toBe(200);
      expect(body.id).toBe(seed.primaryBookingId);
      expect(body.checkInDate).toBe(newCheckIn);
      expect(body.checkOutDate).toBe(newCheckOut);
      expect(body.numberOfNights).toBe(5);
      expect(body.totalPriceInCents).toBe(5 * 15000); // 5 nights * 15000
    });

    it("updates room type without affecting dates or price", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: {
          roomType: "penthouse",
        },
      });

      expect(res.status).toBe(200);
      expect(body.roomType).toBe("penthouse");
      expect(body.numberOfNights).toBe(3); // Unchanged
      expect(body.pricePerNightInCents).toBe(15000); // Unchanged (set at booking time)
      expect(body.totalPriceInCents).toBe(45000); // Unchanged
    });

    it("preserves original price when dates change", async () => {
      const newCheckIn = dateWithOffset(42);
      const newCheckOut = dateWithOffset(44); // 2 nights instead of 3

      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: {
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
        },
      });

      expect(res.status).toBe(200);
      expect(body.numberOfNights).toBe(2);
      expect(body.pricePerNightInCents).toBe(15000); // Original price preserved
      expect(body.totalPriceInCents).toBe(2 * 15000); // Recalculated with original price
    });

    it("can update status to confirmed and cancelled", async () => {
      // Update to pending first (it's already confirmed)
      const { res: res1, body: body1 } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: { status: "pending" },
      });

      expect(res1.status).toBe(200);
      expect(body1.status).toBe("pending");

      // Update back to confirmed
      const { res: res2, body: body2 } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: { status: "confirmed" },
      });

      expect(res2.status).toBe(200);
      expect(body2.status).toBe("confirmed");
    });

    it("rejects invalid date range in update", async () => {
      const sameDay = dateWithOffset(45);

      const { res } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: {
          checkInDate: sameDay,
          checkOutDate: sameDay,
        },
      });

      expect([400, 422]).toContain(res.status);
    });

    it("rejects update when only checkInDate is changed beyond current checkOutDate", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: {
          checkInDate: dateWithOffset(44),
        },
      });

      expect(res.status).toBe(400);
      expect(body).toMatchObject({
        error: "Bad Request",
        message: "checkOutDate must be after checkInDate",
      });
    });

    it("rejects update when only checkOutDate is changed before current checkInDate", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
        body: {
          checkOutDate: dateWithOffset(39),
        },
      });

      expect(res.status).toBe(400);
      expect(body).toMatchObject({
        error: "Bad Request",
        message: "checkOutDate must be after checkInDate",
      });
    });

    it("returns 404 for non-existent booking", async () => {
      const { res, body } = await requestJson({
        method: "PATCH",
        path: `/api/trips/${seed.upcomingTripId}/hotels/nonexistent_booking`,
        userId: seed.primaryUserId,
        body: { roomType: "suite" },
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "Not Found",
        message: "Hotel booking not found",
      });
    });
  });

  describe("DELETE /api/trips/:id/hotels/:hotelBookingId", () => {
    it("cancels booking and may move trip back to draft", async () => {
      // First create a booking on draft trip
      const created = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(31),
          checkOutDate: dateWithOffset(34),
          roomType: "standard",
        },
      });
      expect(created.res.status).toBe(201);

      // Delete the booking
      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.draftTripId}/hotels/${created.body.id}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);

      // Verify booking is cancelled
      const bookingRows = await db
        .select({ status: hotelBooking.status })
        .from(hotelBooking)
        .where(eq(hotelBooking.id, created.body.id));
      expect(bookingRows[0]?.status).toBe("cancelled");
    });

    it("keeps trip upcoming when other travel plans exist (itinerary)", async () => {
      // First create a booking on draft trip
      const created = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(31),
          checkOutDate: dateWithOffset(34),
          roomType: "standard",
        },
      });
      expect(created.res.status).toBe(201);

      // Add an itinerary to the trip
      await db.insert(itinerary).values({
        id: `${ctx.prefix}draft_trip_itinerary`,
        tripId: seed.draftTripId,
      });

      // Delete the hotel booking
      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.draftTripId}/hotels/${created.body.id}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);
    });

    it("keeps trip upcoming when other travel plans exist (flight booking)", async () => {
      // First create a hotel booking on draft trip
      const created = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(31),
          checkOutDate: dateWithOffset(34),
          roomType: "standard",
        },
      });
      expect(created.res.status).toBe(201);

      // Add a flight booking to the trip
      await db.insert(flightBooking).values({
        id: `${ctx.prefix}draft_trip_flight`,
        tripId: seed.draftTripId,
        type: "outbound",
        flightNumber: "TL999",
        airline: "Test Airlines",
        departureAirportCode: "JFK",
        departureCity: "New York",
        departureTime: new Date("2026-07-01T10:00:00.000Z"),
        arrivalAirportCode: "LAX",
        arrivalCity: "Los Angeles",
        arrivalTime: new Date("2026-07-01T16:00:00.000Z"),
        durationMinutes: 360,
        cabinClass: "economy",
        priceInCents: 30000,
        status: "pending",
      });

      // Delete the hotel booking
      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.draftTripId}/hotels/${created.body.id}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);
    });

    it("returns 404 for non-existent booking", async () => {
      const { res, body } = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.upcomingTripId}/hotels/nonexistent_booking`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({
        error: "Not Found",
        message: "Hotel booking not found",
      });
    });
  });
});
