import { Elysia } from "elysia";
import Stripe from "stripe";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import { BadRequestError, NotFoundError } from "../errors";
import { setLogEntityId, setLogContext, useLogger } from "../lib/observability";
import {
  paymentSchema,
  paymentSessionSchema,
  refundPaymentInputSchema,
  stripeWebhookResponseSchema,
} from "@trip-loom/contracts/dto/payments";
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
  .use(requireAuthMacro)
  .post(
    "/webhooks/stripe",
    async ({ body, request, set, status }) => {
      const log = useLogger();

      setLogContext(log, { webhook: { provider: "stripe" } });
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        throw new BadRequestError("Missing Stripe signature");
      }

      try {
        await handleStripeWebhook(signature, String(body));
        return { received: true as const };
      } catch (error) {
        if (isInvalidStripeWebhookRequest(error)) {
          throw new BadRequestError(
            error instanceof Error
              ? error.message
              : "Unable to process Stripe webhook",
          );
        }

        set.status = 500;
        return status(500, {
          error: "InternalServerError",
          message:
            error instanceof Error
              ? error.message
              : "Unable to process Stripe webhook",
          statusCode: 500,
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
    async ({ params }) => {
      setLogEntityId(useLogger(), "payment", params.id);

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
    async ({ user, params }) => {
      const log = useLogger();

      setLogEntityId(log, "payment", params.id);

      const result = await getPayment(user.id, params.id);
      if (!result) {
        throw new NotFoundError("Payment not found");
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
    async ({ user, params, body }) => {
      const log = useLogger();

      setLogEntityId(log, "payment", params.id);

      const result = await refundPayment(user.id, params.id, body);
      if (!result) {
        throw new NotFoundError("Payment not found");
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
