import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createApiClient } from "./api-client";
import { withToolLogging } from "./lib/observability";
import { registerAddItineraryActivity } from "./tools/add-itinerary-activity";
import { registerAddItineraryDay } from "./tools/add-itinerary-day";
import { registerBookFlight } from "./tools/book-flight";
import { registerCancelFlightBooking } from "./tools/cancel-flight-booking";
import { registerCancelHotelBooking } from "./tools/cancel-hotel-booking";
import { registerCreateHotelBooking } from "./tools/create-hotel-booking";
import { registerCreateItinerary } from "./tools/create-itinerary";
import { registerCreateTrip } from "./tools/create-trip";
import { registerDeleteItineraryActivity } from "./tools/delete-itinerary-activity";
import { registerGetDestinationDetails } from "./tools/get-destination-details";
import { registerGetPaymentSession } from "./tools/get-payment-session";
import { registerGetRecommendedDestinations } from "./tools/get-recommended-destinations";
import { registerGetUserPreferences } from "./tools/get-user-preferences";
import { registerGetWeather } from "./tools/get-weather";
import { registerGetPlaceDetails } from "./tools/get-place-details";
import { registerGetTripDetails } from "./tools/get-trip-details";
import { registerSearchDestinations } from "./tools/search-destinations";
import { registerSearchFlights } from "./tools/search-flights";
import { registerSearchHotels } from "./tools/search-hotels";
import { registerSearchPlaces } from "./tools/search-places";
import { registerUpdateTrip } from "./tools/update-trip";
import { registerUpdateItineraryActivity } from "./tools/update-itinerary-activity";
import { registerPing } from "./tools/ping";
import { registerUserPreferencesResource } from "./resources/user-preferences";
import { registerTripDetailsResource } from "./resources/trip-details";
import { registerDestinationDetailsResource } from "./resources/destination-details";
import { registerTripItineraryResource } from "./resources/trip-itinerary";
import { registerUserTripsResource } from "./resources/user-trips";
import { registerUserItineraries } from "./resources/user-itineraries";
import { registerPrompts } from "./prompts";

/**
 * Creates a proxy around McpServer that wraps all `registerTool` callbacks
 * with structured logging via `withToolLogging`.
 *
 * TypeScript's Proxy handler can't preserve generic method signatures, so we
 * type the intercepted function via `McpServer["registerTool"]` — an indexed
 * access type that resolves to the full generic signature.
 */
function withLoggingProxy(server: McpServer): McpServer {
  return new Proxy(server, {
    get(target, prop, receiver) {
      if (prop === "registerTool") {
        const wrapped: McpServer["registerTool"] = (name, config, cb) => {
          return target.registerTool(name, config, withToolLogging(name, cb));
        };
        return wrapped;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/**
 * Creates an MCP server instance with an authenticated Eden client.
 *
 * Each MCP session gets its own server + client, ensuring the OAuth
 * access token is scoped to the authenticated user.
 */
export function createMcpServer(accessToken: string) {
  const server = new McpServer(
    { name: "triploom", version: "1.0.0" },
    { capabilities: { logging: {}, prompts: {}, resources: {} } },
  );

  const apiClient = createApiClient(accessToken);

  // Wrap server so all tool registrations get automatic logging
  const loggedServer = withLoggingProxy(server);

  // Tools (all callbacks automatically wrapped with structured logging)
  registerPing(loggedServer);
  registerGetUserPreferences(loggedServer, apiClient);
  registerGetWeather(loggedServer, apiClient);
  registerGetTripDetails(loggedServer, apiClient);
  registerSearchPlaces(loggedServer, apiClient);
  registerGetPlaceDetails(loggedServer, apiClient);
  registerGetPaymentSession(loggedServer, apiClient);
  registerSearchDestinations(loggedServer, apiClient);
  registerGetDestinationDetails(loggedServer, apiClient);
  registerGetRecommendedDestinations(loggedServer, apiClient);
  registerSearchFlights(loggedServer, apiClient);
  registerBookFlight(loggedServer, apiClient);
  registerCancelFlightBooking(loggedServer, apiClient);
  registerSearchHotels(loggedServer, apiClient);
  registerCreateHotelBooking(loggedServer, apiClient);
  registerCancelHotelBooking(loggedServer, apiClient);
  registerCreateItinerary(loggedServer, apiClient);
  registerAddItineraryDay(loggedServer, apiClient);
  registerAddItineraryActivity(loggedServer, apiClient);
  registerUpdateItineraryActivity(loggedServer, apiClient);
  registerDeleteItineraryActivity(loggedServer, apiClient);
  registerCreateTrip(loggedServer, apiClient);
  registerUpdateTrip(loggedServer, apiClient);

  // Resources (no logging wrapper needed)
  registerUserPreferencesResource(server, apiClient);
  registerTripDetailsResource(server, apiClient);
  registerDestinationDetailsResource(server, apiClient);
  registerTripItineraryResource(server, apiClient);
  registerUserTripsResource(server, apiClient);
  registerUserItineraries(server, apiClient);

  // Prompts
  registerPrompts(server);

  return server;
}
