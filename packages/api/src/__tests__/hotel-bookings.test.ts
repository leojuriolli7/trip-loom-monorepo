import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { db } from "../db";
import { destination, hotel, hotelBooking, itinerary, payment, trip, user } from "../db/schema";
import { paymentProvider } from "../lib/payments/provider";
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
  hotelId: string;
  secondaryHotelId: string;
  primaryBookingId: string;
  secondaryBookingId: string;
};

let seed: SeedData;

const createPaymentIntentSpy = spyOn(paymentProvider, "createPaymentIntent");
const retrievePaymentIntentSpy = spyOn(paymentProvider, "retrievePaymentIntent");

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

  await db.insert(destination).values({
    id: destinationId,
    name: "Test City",
    country: "Test Country",
    countryCode: "TC",
    timezone: "UTC",
    createdAt: new Date(baseTime),
    updatedAt: new Date(baseTime),
  });

  await db.insert(hotel).values([
    {
      id: hotelId,
      destinationId,
      name: "Grand Test Hotel",
      address: "123 Test Street",
      rating: 4,
      amenities: ["wifi", "pool"],
      roomTypes: ["standard", "suite", "king"],
      priceRange: "moderate",
      avgPricePerNightInCents: 15_000,
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
      roomTypes: ["standard", "double"],
      priceRange: "budget",
      avgPricePerNightInCents: 8_000,
      createdAt: new Date(baseTime + 2_000),
      updatedAt: new Date(baseTime + 2_000),
    },
  ]);

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
      pricePerNightInCents: 15_000,
      totalPriceInCents: 45_000,
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
      pricePerNightInCents: 8_000,
      totalPriceInCents: 24_000,
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
    createPaymentIntentSpy.mockReset();
    retrievePaymentIntentSpy.mockReset();
  });

  afterAll(async () => {
    await cleanupFixtureData();
    authMock.restore();
    createPaymentIntentSpy.mockRestore();
    retrievePaymentIntentSpy.mockRestore();
  });

  describe("Authentication", () => {
    it("protects hotel booking endpoints", async () => {
      const calls = await Promise.all([
        requestJson({ method: "GET", path: `/api/trips/${seed.upcomingTripId}/hotels` }),
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

  describe("POST /api/trips/:id/hotels", () => {
    it("creates a booking and payment session together", async () => {
      createPaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_created`,
        clientSecret: `${ctx.prefix}secret_created`,
        status: "requires_payment_method",
        customerId: `${ctx.prefix}cus_created`,
        metadata: {},
      });

      const checkInDate = dateWithOffset(50);
      const checkOutDate = dateWithOffset(55);

      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate,
          checkOutDate,
          roomType: "suite",
        },
      });

      expect(res.status).toBe(201);
      expect(body.booking).toMatchObject({
        tripId: seed.draftTripId,
        hotelId: seed.hotelId,
        checkInDate,
        checkOutDate,
        roomType: "suite",
        numberOfNights: 5,
        status: "pending",
      });
      expect(body.booking.createdAt).toEqual(expect.any(String));
      expect(body.paymentSession).toMatchObject({
        amountInCents: body.booking.totalPriceInCents,
        currency: "usd",
        status: "pending",
        clientSecret: `${ctx.prefix}secret_created`,
      });
      expect(body.paymentSession.checkoutUrl).toEqual(expect.any(String));

      const paymentRows = await db
        .select({ tripId: payment.tripId, amountInCents: payment.amountInCents, status: payment.status })
        .from(payment)
        .where(eq(payment.id, body.paymentSession.id))
        .limit(1);

      expect(paymentRows[0]).toMatchObject({
        tripId: seed.draftTripId,
        amountInCents: body.booking.totalPriceInCents,
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

      const first = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(50),
          checkOutDate: dateWithOffset(53),
          roomType: "standard",
        },
      });

      retrievePaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_created`,
        clientSecret: `${ctx.prefix}secret_reused`,
        status: "requires_payment_method",
        customerId: `${ctx.prefix}cus_reused`,
        metadata: {
          tripId: seed.draftTripId,
          bookingType: "hotel",
          bookingId: first.body.booking.id,
        },
      });

      const second = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.hotelId,
          checkInDate: dateWithOffset(50),
          checkOutDate: dateWithOffset(53),
          roomType: "standard",
        },
      });

      expect(first.res.status).toBe(201);
      expect(second.res.status).toBe(200);
      expect(second.body.booking.id).toBe(first.body.booking.id);
      expect(second.body.paymentSession.id).toBe(first.body.paymentSession.id);
      expect(second.body.paymentSession.clientSecret).toBe(`${ctx.prefix}secret_reused`);
      expect(createPaymentIntentSpy).toHaveBeenCalledTimes(1);
    });

    it("rejects unsupported room types", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/trips/${seed.draftTripId}/hotels`,
        userId: seed.primaryUserId,
        body: {
          hotelId: seed.secondaryHotelId,
          checkInDate: dateWithOffset(50),
          checkOutDate: dateWithOffset(53),
          roomType: "suite",
        },
      });

      expect(res.status).toBe(400);
      expect(body.message).toContain("does not offer room type");
    });
  });

  describe("Read and cancel flows", () => {
    it("lists only the trip's hotel bookings", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/hotels`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ id: seed.primaryBookingId, tripId: seed.upcomingTripId });
      expect(body[0].createdAt).toEqual(expect.any(String));
    });

    it("returns a single hotel booking with embedded hotel summary", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        id: seed.primaryBookingId,
        hotel: {
          id: seed.hotelId,
          name: "Grand Test Hotel",
        },
      });
    });

    it("cancels a booking without touching another user's data", async () => {
      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);

      const bookingRows = await db
        .select({ status: hotelBooking.status })
        .from(hotelBooking)
        .where(eq(hotelBooking.id, seed.primaryBookingId));
      expect(bookingRows[0]?.status).toBe("cancelled");
    });

    it("returns 404 for another user's trip or booking", async () => {
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
          method: "DELETE",
          path: `/api/trips/${seed.secondaryTripId}/hotels/${seed.secondaryBookingId}`,
          userId: seed.primaryUserId,
        }),
      ]);

      for (const call of calls) {
        expect(call.res.status).toBe(404);
        expect(call.body).toMatchObject({ error: "NotFound" });
      }

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

    it("keeps trip cancellation compatible when itinerary still exists", async () => {
      await db.insert(itinerary).values({
        id: `${ctx.prefix}draft_trip_itinerary`,
        tripId: seed.upcomingTripId,
      });

      const deleted = await requestJson({
        method: "DELETE",
        path: `/api/trips/${seed.upcomingTripId}/hotels/${seed.primaryBookingId}`,
        userId: seed.primaryUserId,
      });

      expect(deleted.res.status).toBe(204);
    });
  });
});
