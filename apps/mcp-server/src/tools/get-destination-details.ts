import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerGetDestinationDetails(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "get_destination_details",
    {
      title: "Get Destination Details",
      description:
        "Retrieve full destination details by ID, including metadata and related top hotels for that destination.",
      inputSchema: z.object({
        destinationId: z
          .string()
          .describe("The unique ID of the destination to inspect in detail."),
      }),
    },
    async ({ destinationId }) => {
      const { data, error } = await apiClient.api
        .destinations({ id: destinationId })
        .detail.get();

      if (error) {
        const message =
          error.status === 404
            ? `Destination not found: ${destinationId}`
            : `Failed to fetch destination details: ${error.status ?? "unknown error"}`;

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
