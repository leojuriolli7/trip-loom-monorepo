import { describe, expect, it } from "bun:test";
import Stripe from "stripe";
import { paymentProvider } from "./provider";

describe("paymentProvider.constructWebhookEvent", () => {
  it("verifies Stripe webhooks with the async crypto path on Bun", async () => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    expect(webhookSecret).toBeDefined();
    expect(stripeSecretKey).toBeDefined();

    const stripe = new Stripe(stripeSecretKey!);
    const payload = JSON.stringify({
      id: "evt_test_webhook",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_webhook",
          object: "payment_intent",
          status: "succeeded",
          client_secret: null,
          customer: "cus_test_webhook",
          metadata: {
            tripId: "trip_test",
            bookingType: "hotel",
            bookingId: "booking_test",
          },
        },
      },
    });

    const signature = await stripe.webhooks.generateTestHeaderStringAsync({
      payload,
      secret: webhookSecret!,
    });

    const event = await paymentProvider.constructWebhookEvent(signature, payload);

    expect(event).toMatchObject({
      kind: "payment_intent",
      id: "evt_test_webhook",
      type: "payment_intent.succeeded",
      paymentIntent: {
        id: "pi_test_webhook",
        status: "succeeded",
        customerId: "cus_test_webhook",
        metadata: {
          tripId: "trip_test",
          bookingType: "hotel",
          bookingId: "booking_test",
        },
      },
    });
  });
});
