import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { paymentBookingTypeValues } from "@trip-loom/api/dto";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerCreatePaymentIntent(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "create_payment_intent",
    {
      title: "Create Payment Intent",
      description:
        "Create a Stripe payment intent for a pending trip booking. Returns payment intent metadata including `clientSecret`, `paymentId`, and normalized payment amount/currency.",
      inputSchema: z.object({
        tripId: z.string().min(1).describe("The trip ID tied to this payment."),
        amountInCents: z
          .number()
          .int()
          .positive()
          .describe(
            "Total charge amount in cents; must match booking total exactly.",
          ),
        currency: z
          .string()
          .trim()
          .length(3)
          .optional()
          .describe("ISO 4217 currency code (3 letters). Defaults to `usd`."),
        description: z
          .string()
          .trim()
          .min(1)
          .max(500)
          .optional()
          .describe("Optional payment description."),
        bookingType: z
          .enum(paymentBookingTypeValues)
          .describe(
            "Booking resource type linked to this payment (`flight` or `hotel`).",
          ),
        bookingId: z
          .string()
          .min(1)
          .describe("Booking ID linked to this payment intent."),
      }),
    },
    async ({
      tripId,
      amountInCents,
      currency,
      description,
      bookingType,
      bookingId,
    }) => {
      const { data, error } = await apiClient.api.payments[
        "create-intent"
      ].post({
        tripId,
        amountInCents,
        currency: currency ?? "usd",
        description,
        bookingType,
        bookingId,
      });

      if (error) {
        let message = `Failed to create payment intent: ${error.status ?? "unknown error"}`;

        if (error.status === 400) {
          message =
            "Invalid payment intent payload (for example, booking mismatch, non-pending booking, or amount mismatch).";
        } else if (error.status === 401) {
          message = "User is not authenticated to create payment intents.";
        } else if (error.status === 404) {
          message = `Trip not found: ${tripId}`;
        } else if (error.status === 409) {
          message = `Booking already has an associated payment: ${bookingId}`;
        }

        return {
          isError: true as const,
          content: [{ type: "text" as const, text: message }],
        };
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );
}
