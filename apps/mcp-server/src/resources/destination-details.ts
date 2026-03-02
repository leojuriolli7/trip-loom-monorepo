import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client";

export function registerDestinationDetailsResource(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerResource(
    "destination-details",
    new ResourceTemplate("triploom://destinations/{destinationId}", {
      list: undefined,
    }),
    {
      title: "Destination Details",
      description:
        "Full details for a destination including highlights, country, region, timezone, currency, language, and top hotels. Use a destination ID obtained from search results or trip data.",
      mimeType: "application/json",
    },
    async (uri, { destinationId }) => {
      const { data, error } = await apiClient.api
        .destinations({ id: String(destinationId) })
        .get();

      if (error) {
        throw new Error(
          error.status === 404
            ? `Destination not found: ${destinationId}`
            : `Failed to fetch destination: ${error.status ?? "unknown error"}`,
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
