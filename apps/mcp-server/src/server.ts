import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createApiClient } from "./api-client";
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
import { registerGetTripDetails } from "./tools/get-trip-details";
import { registerSearchDestinations } from "./tools/search-destinations";
import { registerSearchFlights } from "./tools/search-flights";
import { registerSearchHotels } from "./tools/search-hotels";
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

  // Tools
  registerPing(server);
  registerGetUserPreferences(server, apiClient);
  registerGetWeather(server, apiClient);
  registerGetTripDetails(server, apiClient);
  registerGetPaymentSession(server, apiClient);
  registerSearchDestinations(server, apiClient);
  registerGetDestinationDetails(server, apiClient);
  registerGetRecommendedDestinations(server, apiClient);
  registerSearchFlights(server, apiClient);
  registerBookFlight(server, apiClient);
  registerCancelFlightBooking(server, apiClient);
  registerSearchHotels(server, apiClient);
  registerCreateHotelBooking(server, apiClient);
  registerCancelHotelBooking(server, apiClient);
  registerCreateItinerary(server, apiClient);
  registerAddItineraryDay(server, apiClient);
  registerAddItineraryActivity(server, apiClient);
  registerUpdateItineraryActivity(server, apiClient);
  registerDeleteItineraryActivity(server, apiClient);
  registerCreateTrip(server, apiClient);
  registerUpdateTrip(server, apiClient);

  // Resources
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
