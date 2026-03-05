import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  confirmPaymentInputSchema,
  createPaymentIntentInputSchema,
  paymentIntentResponseSchema,
  paymentSchema,
  refundPaymentInputSchema,
  stripeWebhookResponseSchema,
} from "@trip-loom/contracts/dto/payments";
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth/plugin";
import {
  confirmPayment,
  createPaymentIntent,
  getPayment,
  handleStripeWebhook,
  refundPayment,
} from "../services/payments";

const paymentParamsSchema = z.object({
  id: z.string().min(1),
});

export const paymentRoutes = new Elysia({
  name: "payments",
  prefix: "/api",
})
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  .post(
    "/webhooks/stripe",
    async ({ request, status, wideEvent }) => {
      wideEvent.webhook_provider = "stripe";
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return status(400, {
          error: "Bad Request",
          message: "Missing Stripe signature",
          statusCode: 400,
        });
      }

      const payload = await request.text();

      try {
        await handleStripeWebhook(signature, payload);
        return { received: true as const };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to process Stripe webhook";
        return status(400, {
          error: "Bad Request",
          message,
          statusCode: 400,
        });
      }
    },
    {
      response: {
        200: stripeWebhookResponseSchema,
        400: errorResponseSchema,
      },
    },
  )
  .post(
    "/payments/create-intent",
    async ({ user, body, status, wideEvent }) => {
      wideEvent.trip_id = body.tripId;

      const result = await createPaymentIntent(user.id, body);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      wideEvent.payment_id = result.paymentId;
      return result;
    },
    {
      auth: true,
      body: createPaymentIntentInputSchema,
      response: {
        200: paymentIntentResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
  )
  .post(
    "/payments/confirm",
    async ({ user, body, status, wideEvent }) => {
      wideEvent.payment_intent_id = body.paymentIntentId;

      const result = await confirmPayment(user.id, body);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Payment not found",
          statusCode: 404,
        });
      }

      wideEvent.payment_id = result.id;
      return result;
    },
    {
      auth: true,
      body: confirmPaymentInputSchema,
      response: {
        200: paymentSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .get(
    "/payments/:id",
    async ({ user, params, status, wideEvent }) => {
      wideEvent.payment_id = params.id;

      const result = await getPayment(user.id, params.id);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Payment not found",
          statusCode: 404,
        });
      }

      return result;
    },
    {
      auth: true,
      params: paymentParamsSchema,
      response: {
        200: paymentSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post(
    "/payments/:id/refund",
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.payment_id = params.id;

      const result = await refundPayment(user.id, params.id, body);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Payment not found",
          statusCode: 404,
        });
      }

      return result;
    },
    {
      auth: true,
      params: paymentParamsSchema,
      body: refundPaymentInputSchema,
      response: {
        200: paymentSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
