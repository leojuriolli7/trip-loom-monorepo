import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client";

export function registerUserItineraries(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerResource(
    "user-itineraries",
    "triploom://user/itineraries",
    {
      title: "User Itineraries",
      description:
        "List of 20 last itineraries belonging to the authenticated user.",
      mimeType: "application/json",
    },
    async (uri) => {
      const { data, error } = await apiClient.api.trips.itineraries.get({
        query: { limit: 5 },
      });

      if (error) {
        throw new Error(
          `Failed to fetch user itineraries: ${error.status ?? "unknown error"}`,
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
