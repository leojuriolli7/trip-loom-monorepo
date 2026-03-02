import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client";

export function registerUserTripsResource(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerResource(
    "user-trips",
    "triploom://user/trips",
    {
      title: "User Trips",
      description:
        "List of all trips belonging to the authenticated user. Each trip includes its status, dates, destination summary, and planning progress. Useful for getting an overview of past, current, and upcoming trips.",
      mimeType: "application/json",
    },
    async (uri) => {
      const { data, error } = await apiClient.api.trips.get({
        query: { limit: 100 },
      });

      if (error) {
        throw new Error(
          `Failed to fetch user trips: ${error.status ?? "unknown error"}`,
        );
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );
}
