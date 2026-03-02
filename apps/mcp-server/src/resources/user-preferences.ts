import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client";

export function registerUserPreferencesResource(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerResource(
    "user-preferences",
    "triploom://user/preferences",
    {
      title: "User Travel Preferences",
      description:
        "The authenticated user's travel preferences including preferred cabin class, budget range, travel interests, preferred regions, dietary restrictions, and accessibility needs. Useful as context for personalizing recommendations.",
      mimeType: "application/json",
    },
    async (uri) => {
      const { data, error } = await apiClient.api.user.preferences.get();

      if (error) {
        throw new Error(
          `Failed to fetch user preferences: ${error.status ?? "unknown error"}`,
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
