import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerUpdateTrip(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "update_trip",
    {
      title: "Update Trip",
      description:
        "Update an existing trip by ID. Supports updating destination, title, and dates. Returns the updated trip summary. Note: trip status is computed automatically from dates and cannot be set directly.",
      inputSchema: z
        .object({
          tripId: z.string().describe("The unique trip ID to update."),
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
    async ({ tripId, destinationId, title, startDate, endDate }) => {
      const { data, error } = await apiClient.api.trips({ id: tripId }).patch({
        destinationId,
        title,
        startDate,
        endDate,
      });

      if (error) {
        let message = `Failed to update trip: ${error.status ?? "unknown error"}`;

        if (error.status === 400) {
          message =
            "Invalid trip update payload (for example, invalid destination or invalid date range).";
        } else if (error.status === 401) {
          message = "User is not authenticated to update this trip.";
        } else if (error.status === 404) {
          message = `Trip not found: ${tripId}`;
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
