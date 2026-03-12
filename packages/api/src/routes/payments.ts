import { Elysia } from "elysia";
import Stripe from "stripe";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  paymentSchema,
  paymentSessionSchema,
  refundPaymentInputSchema,
  stripeWebhookResponseSchema,
} from "@trip-loom/contracts/dto/payments";
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import {
  getPayment,
  getHostedPaymentSession,
  handleStripeWebhook,
  refundPayment,
} from "../services/payments";

const paymentParamsSchema = z.object({
  id: z.string().min(1),
});

const isInvalidStripeWebhookRequest = (error: unknown): boolean =>
  error instanceof Stripe.errors.StripeSignatureVerificationError ||
  error instanceof SyntaxError;

export const paymentRoutes = new Elysia({
  name: "payments",
  prefix: "/api",
})
  .use(createDefaultRateLimit())
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  .post(
    "/webhooks/stripe",
    async ({ body, request, status, wideEvent }) => {
      wideEvent.webhook_provider = "stripe";
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return status(400, {
          error: "BadRequest",
          message: "Missing Stripe signature",
          statusCode: 400,
        });
      }

      try {
        await handleStripeWebhook(signature, String(body));
        return { received: true as const };
      } catch (error) {
        const isBadRequest = isInvalidStripeWebhookRequest(error);
        const message =
          error instanceof Error
            ? error.message
            : "Unable to process Stripe webhook";
        return status(isBadRequest ? 400 : 500, {
          error: isBadRequest ? "BadRequest" : "InternalServerError",
          message,
          statusCode: isBadRequest ? 400 : 500,
        });
      }
    },
    {
      parse: "text",
      response: {
        200: stripeWebhookResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  )
  .get(
    "/payments/:id/session",
    async ({ params, wideEvent }) => {
      wideEvent.payment_id = params.id;

      return getHostedPaymentSession(params.id);
    },
    {
      params: paymentParamsSchema,
      response: {
        200: paymentSessionSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
        500: errorResponseSchema,
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
          error: "NotFound",
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
          error: "NotFound",
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
