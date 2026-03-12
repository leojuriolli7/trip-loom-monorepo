import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { weatherRequestSchema } from "@trip-loom/contracts/dto/weather";
import type { ApiClient } from "../api-client";

export function registerGetWeather(server: McpServer, apiClient: ApiClient) {
  server.registerTool(
    "get_weather",
    {
      title: "Get Weather",
      description:
        "Get forecast weather for a city and date range inside the short-term forecast window. Provide a city name, optionally with country for clarity like 'Paris, France', plus the requested start date and optional end date for multi-day lookups.",
      inputSchema: weatherRequestSchema,
    },
    async (input) => {
      const { data, error } = await apiClient.api.weather.forecast.get({
        query: input,
      });

      if (error) {
        const message =
          error.status === 400
            ? "Invalid weather parameters or requested dates fall outside the forecast window."
            : error.status === 401
              ? "User is not authenticated to fetch weather."
              : error.status === 404
                ? "Weather location could not be resolved."
                : `Failed to fetch weather: ${error.status ?? "unknown error"}`;

        return {
          isError: true as const,
          content: [{ type: "text" as const, text: message }],
        };
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );
}
