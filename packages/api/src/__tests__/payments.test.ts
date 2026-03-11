import { and, eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  setDefaultTimeout,
  spyOn,
} from "bun:test";
import { db } from "../db";
import {
  airport,
  destination,
  flightBooking,
  hotel,
  hotelBooking,
  payment,
  stripeWebhookEvent,
  trip,
  user,
} from "../db/schema";
import { paymentProvider } from "../lib/payments/provider";
import { paymentRoutes } from "../routes/payments";
import {
  createHeaderAuthMock,
  createJsonRequester,
  createTestApp,
  createTestContext,
  dateWithOffset,
} from "./harness";

const ctx = createTestContext("payment");
const app = createTestApp().use(paymentRoutes);
const request = createJsonRequester(app);
const requestJson = request.requestJson;
const authMock = createHeaderAuthMock(ctx.prefix);

type SeedData = {
  primaryUserId: string;
  secondaryUserId: string;
  primaryTripId: string;
  secondaryTripId: string;
  refundableHotelBookingId: string;
  partiallyRefundableFlightBookingId: string;
  webhookHotelBookingId: string;
  pendingPaymentId: string;
  fullRefundPaymentId: string;
  partialRefundPaymentId: string;
  webhookPaymentId: string;
  secondaryPaymentId: string;
};

let seed: SeedData;

const createRefundSpy = spyOn(paymentProvider, "createRefund");
const constructWebhookEventSpy = spyOn(paymentProvider, "constructWebhookEvent");
const retrievePaymentIntentSpy = spyOn(paymentProvider, "retrievePaymentIntent");

setDefaultTimeout(15_000);

const requestWebhook = async ({
  signature = "t=12345,v1=test-signature",
  payload = "{}",
}: {
  signature?: string;
  payload?: string;
}) => {
  const res = await app.handle(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    }),
  );

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await res.json() : null;

  return { res, body };
};

const cleanupFixtureData = async () => {
  await ctx.cleanup();
};

const seedFixtureData = async () => {
  const baseTime = Date.parse("2025-07-01T00:00:00.000Z");

  const primaryUserId = `${ctx.prefix}user_primary`;
  const secondaryUserId = `${ctx.prefix}user_secondary`;
  const primaryTripId = `${ctx.prefix}trip_primary`;
  const secondaryTripId = `${ctx.prefix}trip_secondary`;
  const destinationId = `${ctx.prefix}destination`;
  const hotelId = `${ctx.prefix}hotel_refundable`;
  const webhookHotelId = `${ctx.prefix}hotel_webhook`;
  const refundableHotelBookingId = `${ctx.prefix}hotel_booking_refundable`;
  const partiallyRefundableFlightBookingId = `${ctx.prefix}flight_booking_partial_refund`;
  const webhookHotelBookingId = `${ctx.prefix}hotel_booking_webhook`;
  const pendingPaymentId = `${ctx.prefix}payment_pending`;
  const fullRefundPaymentId = `${ctx.prefix}payment_full_refund`;
  const partialRefundPaymentId = `${ctx.prefix}payment_partial_refund`;
  const webhookPaymentId = `${ctx.prefix}payment_webhook`;
  const secondaryPaymentId = `${ctx.prefix}payment_secondary`;

  await Promise.all([
    db
      .insert(airport)
      .values({
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
      })
      .onConflictDoNothing(),
    db
      .insert(airport)
      .values({
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
      })
      .onConflictDoNothing(),
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
      name: "Payment Test Hotel Refundable",
      address: "124 Test Street",
      rating: 4,
      amenities: ["wifi", "pool"],
      priceRange: "moderate",
      avgPricePerNightInCents: 20_000,
      createdAt: new Date(baseTime + 1_100),
      updatedAt: new Date(baseTime + 1_100),
    },
    {
      id: webhookHotelId,
      destinationId,
      name: "Payment Test Hotel Webhook",
      address: "125 Test Street",
      rating: 4,
      amenities: ["wifi", "pool"],
      priceRange: "moderate",
      avgPricePerNightInCents: 20_000,
      createdAt: new Date(baseTime + 1_200),
      updatedAt: new Date(baseTime + 1_200),
    },
  ]);

  await db.insert(trip).values([
    {
      id: primaryTripId,
      userId: primaryUserId,
      destinationId,
      title: "Primary Payment Trip",
      startDate: dateWithOffset(30),
      endDate: dateWithOffset(37),
      createdAt: new Date(baseTime + 2_000),
      updatedAt: new Date(baseTime + 2_000),
    },
    {
      id: secondaryTripId,
      userId: secondaryUserId,
      destinationId,
      title: "Secondary Payment Trip",
      startDate: dateWithOffset(35),
      endDate: dateWithOffset(41),
      createdAt: new Date(baseTime + 3_000),
      updatedAt: new Date(baseTime + 3_000),
    },
  ]);

  await db.insert(payment).values([
    {
      id: pendingPaymentId,
      tripId: primaryTripId,
      stripePaymentIntentId: `${ctx.prefix}pi_pending`,
      stripeCustomerId: null,
      amountInCents: 42_000,
      currency: "usd",
      status: "pending",
      description: "Pending payment",
      refundedAmountInCents: 0,
      metadata: JSON.stringify({
        tripId: primaryTripId,
        bookingType: "flight",
        bookingId: partiallyRefundableFlightBookingId,
      }),
      createdAt: new Date(baseTime + 4_000),
      updatedAt: new Date(baseTime + 4_000),
    },
    {
      id: fullRefundPaymentId,
      tripId: primaryTripId,
      stripePaymentIntentId: `${ctx.prefix}pi_full_refund`,
      stripeCustomerId: `${ctx.prefix}cus_full_refund`,
      amountInCents: 60_000,
      currency: "usd",
      status: "succeeded",
      description: "Full refund candidate",
      refundedAmountInCents: 0,
      metadata: JSON.stringify({
        tripId: primaryTripId,
        bookingType: "hotel",
        bookingId: refundableHotelBookingId,
      }),
      createdAt: new Date(baseTime + 5_000),
      updatedAt: new Date(baseTime + 5_000),
    },
    {
      id: partialRefundPaymentId,
      tripId: primaryTripId,
      stripePaymentIntentId: `${ctx.prefix}pi_partial_refund`,
      stripeCustomerId: `${ctx.prefix}cus_partial_refund`,
      amountInCents: 50_000,
      currency: "usd",
      status: "succeeded",
      description: "Partial refund candidate",
      refundedAmountInCents: 0,
      metadata: JSON.stringify({
        tripId: primaryTripId,
        bookingType: "flight",
        bookingId: partiallyRefundableFlightBookingId,
      }),
      createdAt: new Date(baseTime + 6_000),
      updatedAt: new Date(baseTime + 6_000),
    },
    {
      id: webhookPaymentId,
      tripId: primaryTripId,
      stripePaymentIntentId: `${ctx.prefix}pi_webhook`,
      stripeCustomerId: null,
      amountInCents: 70_000,
      currency: "usd",
      status: "pending",
      description: "Webhook candidate",
      refundedAmountInCents: 0,
      metadata: JSON.stringify({
        tripId: primaryTripId,
        bookingType: "hotel",
        bookingId: webhookHotelBookingId,
      }),
      createdAt: new Date(baseTime + 7_000),
      updatedAt: new Date(baseTime + 7_000),
    },
    {
      id: secondaryPaymentId,
      tripId: secondaryTripId,
      stripePaymentIntentId: `${ctx.prefix}pi_secondary`,
      stripeCustomerId: null,
      amountInCents: 25_000,
      currency: "usd",
      status: "succeeded",
      description: "Secondary user payment",
      refundedAmountInCents: 0,
      metadata: JSON.stringify({
        tripId: secondaryTripId,
        bookingType: "hotel",
        bookingId: `${ctx.prefix}secondary_hotel_booking`,
      }),
      createdAt: new Date(baseTime + 8_000),
      updatedAt: new Date(baseTime + 8_000),
    },
  ]);

  await db.insert(flightBooking).values([
    {
      id: partiallyRefundableFlightBookingId,
      tripId: primaryTripId,
      paymentId: partialRefundPaymentId,
      type: "outbound",
      flightNumber: "TL330",
      airline: "TripLoom Airways",
      departureAirportCode: "JFK",
      departureCity: "New York",
      departureTime: new Date("2026-10-20T12:00:00.000Z"),
      arrivalAirportCode: "LAX",
      arrivalCity: "Los Angeles",
      arrivalTime: new Date("2026-10-20T18:00:00.000Z"),
      durationMinutes: 360,
      seatNumber: "9C",
      cabinClass: "economy",
      priceInCents: 50_000,
      status: "confirmed",
      createdAt: new Date(baseTime + 9_000),
      updatedAt: new Date(baseTime + 9_000),
    },
  ]);

  await db.insert(hotelBooking).values([
    {
      id: refundableHotelBookingId,
      tripId: primaryTripId,
      hotelId,
      paymentId: fullRefundPaymentId,
      checkInDate: dateWithOffset(34),
      checkOutDate: dateWithOffset(37),
      roomType: "suite",
      numberOfNights: 3,
      pricePerNightInCents: 20_000,
      totalPriceInCents: 60_000,
      status: "confirmed",
      createdAt: new Date(baseTime + 10_000),
      updatedAt: new Date(baseTime + 10_000),
    },
    {
      id: webhookHotelBookingId,
      tripId: primaryTripId,
      hotelId: webhookHotelId,
      paymentId: null,
      checkInDate: dateWithOffset(38),
      checkOutDate: dateWithOffset(41),
      roomType: "deluxe",
      numberOfNights: 3,
      pricePerNightInCents: 23_333,
      totalPriceInCents: 70_000,
      status: "pending",
      createdAt: new Date(baseTime + 11_000),
      updatedAt: new Date(baseTime + 11_000),
    },
  ]);

  seed = {
    primaryUserId,
    secondaryUserId,
    primaryTripId,
    secondaryTripId,
    refundableHotelBookingId,
    partiallyRefundableFlightBookingId,
    webhookHotelBookingId,
    pendingPaymentId,
    fullRefundPaymentId,
    partialRefundPaymentId,
    webhookPaymentId,
    secondaryPaymentId,
  };
};

describe("Payments API", () => {
  beforeAll(async () => {
    authMock.enable();
  });

  beforeEach(async () => {
    await cleanupFixtureData();
    await seedFixtureData();
    createRefundSpy.mockReset();
    constructWebhookEventSpy.mockReset();
    retrievePaymentIntentSpy.mockReset();
  });

  afterAll(async () => {
    await cleanupFixtureData();
    authMock.restore();
    createRefundSpy.mockRestore();
    constructWebhookEventSpy.mockRestore();
    retrievePaymentIntentSpy.mockRestore();
  });

  describe("Authentication", () => {
    it("protects read and refund endpoints", async () => {
      const calls = await Promise.all([
        requestJson({
          method: "GET",
          path: `/api/payments/${seed.fullRefundPaymentId}`,
        }),
        requestJson({
          method: "POST",
          path: `/api/payments/${seed.fullRefundPaymentId}/refund`,
          body: {},
        }),
      ]);

      for (const call of calls) {
        expect(call.res.status).toBe(401);
        expect(call.body).toMatchObject({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }
    });
  });

  describe("GET /api/payments/:id", () => {
    it("returns the requested payment for the owner", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/payments/${seed.fullRefundPaymentId}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        id: seed.fullRefundPaymentId,
        tripId: seed.primaryTripId,
        status: "succeeded",
      });
      expect(body.createdAt).toEqual(expect.any(String));
      expect(body.updatedAt).toEqual(expect.any(String));
    });

    it("reconciles a stale pending payment before returning it", async () => {
      retrievePaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_webhook`,
        clientSecret: null,
        status: "succeeded",
        customerId: `${ctx.prefix}cus_reconciled`,
        metadata: {
          tripId: seed.primaryTripId,
          bookingType: "hotel",
          bookingId: seed.webhookHotelBookingId,
        },
      });

      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/payments/${seed.webhookPaymentId}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        id: seed.webhookPaymentId,
        status: "succeeded",
        stripeCustomerId: `${ctx.prefix}cus_reconciled`,
      });

      const bookingRows = await db
        .select({ paymentId: hotelBooking.paymentId, status: hotelBooking.status })
        .from(hotelBooking)
        .where(eq(hotelBooking.id, seed.webhookHotelBookingId))
        .limit(1);

      expect(bookingRows[0]).toMatchObject({
        paymentId: seed.webhookPaymentId,
        status: "confirmed",
      });
    });

    it("returns 404 for another user's payment", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/payments/${seed.secondaryPaymentId}`,
        userId: seed.primaryUserId,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({ error: "NotFound" });
    });
  });

  describe("GET /api/payments/:id/session", () => {
    it("returns a hosted payment session without auth when payment is resumable", async () => {
      retrievePaymentIntentSpy.mockResolvedValue({
        id: `${ctx.prefix}pi_pending`,
        clientSecret: `${ctx.prefix}secret_pending`,
        status: "requires_payment_method",
        customerId: `${ctx.prefix}cus_pending`,
        metadata: {
          tripId: seed.primaryTripId,
          bookingType: "flight",
          bookingId: seed.partiallyRefundableFlightBookingId,
        },
      });

      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/payments/${seed.pendingPaymentId}/session`,
      });

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        id: seed.pendingPaymentId,
        amountInCents: 42_000,
        currency: "usd",
        status: "pending",
        clientSecret: `${ctx.prefix}secret_pending`,
      });
      expect(body.checkoutUrl).toBe(
        `${process.env.FRONTEND_BASE_URL}/payments/${seed.pendingPaymentId}`,
      );
    });

    it("returns 409 when the payment session is already completed", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/payments/${seed.fullRefundPaymentId}/session`,
      });

      expect(res.status).toBe(409);
      expect(body.message).toContain("already been completed");
    });

    it("returns 404 for an unknown payment session", async () => {
      const { res, body } = await requestJson({
        method: "GET",
        path: `/api/payments/${ctx.prefix}missing/session`,
      });

      expect(res.status).toBe(404);
      expect(body).toMatchObject({ error: "NotFound" });
    });
  });

  describe("POST /api/payments/:id/refund", () => {
    it("processes full refunds and cancels linked hotel bookings", async () => {
      createRefundSpy.mockResolvedValue({
        id: `${ctx.prefix}refund_full`,
        paymentIntentId: `${ctx.prefix}pi_full_refund`,
        amountInCents: 60_000,
      });

      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/payments/${seed.fullRefundPaymentId}/refund`,
        userId: seed.primaryUserId,
        body: {},
      });

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        id: seed.fullRefundPaymentId,
        status: "refunded",
        refundedAmountInCents: 60_000,
      });

      const bookingRows = await db
        .select({ status: hotelBooking.status })
        .from(hotelBooking)
        .where(eq(hotelBooking.id, seed.refundableHotelBookingId))
        .limit(1);

      expect(bookingRows[0]?.status).toBe("cancelled");
    });

    it("supports partial refunds without cancelling linked flight bookings", async () => {
      createRefundSpy.mockResolvedValue({
        id: `${ctx.prefix}refund_partial`,
        paymentIntentId: `${ctx.prefix}pi_partial_refund`,
        amountInCents: 15_000,
      });

      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/payments/${seed.partialRefundPaymentId}/refund`,
        userId: seed.primaryUserId,
        body: { amountInCents: 15_000 },
      });

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        id: seed.partialRefundPaymentId,
        status: "partially_refunded",
        refundedAmountInCents: 15_000,
      });

      const bookingRows = await db
        .select({ status: flightBooking.status })
        .from(flightBooking)
        .where(eq(flightBooking.id, seed.partiallyRefundableFlightBookingId))
        .limit(1);

      expect(bookingRows[0]?.status).toBe("confirmed");
    });

    it("rejects refunds for non-succeeded payments", async () => {
      const { res, body } = await requestJson({
        method: "POST",
        path: `/api/payments/${seed.pendingPaymentId}/refund`,
        userId: seed.primaryUserId,
        body: {},
      });

      expect(res.status).toBe(400);
      expect(body.message).toContain("Only succeeded or partially refunded payments");
    });
  });

  describe("POST /api/webhooks/stripe", () => {
    it("updates payment status and links payment to booking on payment_intent.succeeded", async () => {
      constructWebhookEventSpy.mockResolvedValue({
        kind: "payment_intent",
        id: `${ctx.prefix}evt_succeeded`,
        type: "payment_intent.succeeded",
        payload: JSON.stringify({ type: "payment_intent.succeeded" }),
        paymentIntent: {
          id: `${ctx.prefix}pi_webhook`,
          clientSecret: null,
          status: "succeeded",
          customerId: `${ctx.prefix}cus_webhook`,
          metadata: {
            tripId: seed.primaryTripId,
            bookingType: "hotel",
            bookingId: seed.webhookHotelBookingId,
          },
        },
      });

      const { res, body } = await requestWebhook({
        payload: JSON.stringify({ id: "event_1" }),
      });

      expect(res.status).toBe(200);
      expect(body).toEqual({ received: true });

      const paymentRows = await db
        .select({
          status: payment.status,
          stripeCustomerId: payment.stripeCustomerId,
        })
        .from(payment)
        .where(eq(payment.id, seed.webhookPaymentId))
        .limit(1);

      expect(paymentRows[0]).toMatchObject({
        status: "succeeded",
        stripeCustomerId: `${ctx.prefix}cus_webhook`,
      });

      const bookingRows = await db
        .select({ paymentId: hotelBooking.paymentId, status: hotelBooking.status })
        .from(hotelBooking)
        .where(eq(hotelBooking.id, seed.webhookHotelBookingId))
        .limit(1);

      expect(bookingRows[0]).toMatchObject({
        paymentId: seed.webhookPaymentId,
        status: "confirmed",
      });
    });

    it("keeps retryable failed intents in a pending local state", async () => {
      constructWebhookEventSpy.mockResolvedValue({
        kind: "payment_intent",
        id: `${ctx.prefix}evt_retryable_failed`,
        type: "payment_intent.payment_failed",
        payload: JSON.stringify({ type: "payment_intent.payment_failed" }),
        paymentIntent: {
          id: `${ctx.prefix}pi_pending`,
          clientSecret: `${ctx.prefix}secret_retryable`,
          status: "requires_payment_method",
          customerId: `${ctx.prefix}cus_retryable`,
          metadata: {
            tripId: seed.primaryTripId,
            bookingType: "flight",
            bookingId: seed.partiallyRefundableFlightBookingId,
          },
        },
      });

      const { res, body } = await requestWebhook({
        payload: JSON.stringify({ id: "event_retryable_failed" }),
      });

      expect(res.status).toBe(200);
      expect(body).toEqual({ received: true });

      const paymentRows = await db
        .select({ status: payment.status, stripeCustomerId: payment.stripeCustomerId })
        .from(payment)
        .where(eq(payment.id, seed.pendingPaymentId))
        .limit(1);

      expect(paymentRows[0]).toMatchObject({
        status: "pending",
        stripeCustomerId: `${ctx.prefix}cus_retryable`,
      });
    });

    it("ignores duplicate webhook event ids", async () => {
      constructWebhookEventSpy.mockResolvedValue({
        kind: "payment_intent",
        id: `${ctx.prefix}evt_duplicate`,
        type: "payment_intent.succeeded",
        payload: JSON.stringify({ type: "payment_intent.succeeded" }),
        paymentIntent: {
          id: `${ctx.prefix}pi_webhook`,
          clientSecret: null,
          status: "succeeded",
          customerId: `${ctx.prefix}cus_webhook`,
          metadata: {
            tripId: seed.primaryTripId,
            bookingType: "hotel",
            bookingId: seed.webhookHotelBookingId,
          },
        },
      });

      const first = await requestWebhook({ payload: JSON.stringify({ id: "event_duplicate" }) });
      const second = await requestWebhook({ payload: JSON.stringify({ id: "event_duplicate" }) });

      expect(first.res.status).toBe(200);
      expect(second.res.status).toBe(200);

      const eventRows = await db
        .select({ id: stripeWebhookEvent.id })
        .from(stripeWebhookEvent)
        .where(eq(stripeWebhookEvent.id, `${ctx.prefix}evt_duplicate`));

      expect(eventRows).toHaveLength(1);
    });

    it("returns 400 when Stripe signature is missing", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      );

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toMatchObject({ error: "BadRequest" });
    });
  });
});
