import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

/**
 * Testing/bootstrap tool:
 * Helps create draft trips directly from MCP so downstream tools can be validated end-to-end.
 * This can be unregistered later if trip creation is handled exclusively by the frontend.
 */
export function registerCreateTrip(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "create_trip",
    {
      title: "Create Trip",
      description:
        "Create a new trip for the authenticated user. Returns the created trip summary including destination info and computed planning flags.",
      inputSchema: z
        .object({
          destinationId: z
            .string()
            .min(1)
            .nullable()
            .optional()
            .describe("Optional destination ID to associate with the trip."),
          title: z
            .string()
            .trim()
            .min(1)
            .max(120)
            .nullable()
            .optional()
            .describe("Optional trip title."),
          startDate: z
            .string()
            .date()
            .nullable()
            .optional()
            .describe("Optional trip start date in YYYY-MM-DD format."),
          endDate: z
            .string()
            .date()
            .nullable()
            .optional()
            .describe("Optional trip end date in YYYY-MM-DD format."),
        })
        .refine(
          (value) =>
            !value.startDate ||
            !value.endDate ||
            value.startDate <= value.endDate,
          {
            message: "startDate must be before or equal to endDate",
            path: ["endDate"],
          },
        ),
    },
    async ({ destinationId, title, startDate, endDate }) => {
      const { data, error } = await apiClient.api.trips.post({
        destinationId,
        title,
        startDate,
        endDate,
      });

      if (error) {
        let message = `Failed to create trip: ${error.status ?? "unknown error"}`;

        if (error.status === 400) {
          message =
            "Invalid trip creation payload (for example, invalid destination or invalid date range).";
        } else if (error.status === 401) {
          message = "User is not authenticated to create a trip.";
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
