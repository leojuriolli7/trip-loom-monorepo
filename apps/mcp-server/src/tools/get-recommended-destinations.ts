import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerGetRecommendedDestinations(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "get_recommended_destinations",
    {
      title: "Get Recommended Destinations",
      description:
        "Get personalized destination recommendations for the authenticated user based on their saved travel preferences and prior behavior signals. Each result includes `matchReason` and `matchScore` to explain why it was recommended.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe(
            "Optional number of recommendations to return (1-20). Defaults to 10.",
          ),
      }),
    },
    async ({ limit }) => {
      const { data, error } = await apiClient.api.destinations.recommended.get({
        query: { limit: limit ?? 10 },
      });

      if (error) {
        const message =
          error.status === 401
            ? "User is not authenticated to fetch destination recommendations."
            : `Failed to fetch recommended destinations: ${error.status ?? "unknown error"}`;

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
