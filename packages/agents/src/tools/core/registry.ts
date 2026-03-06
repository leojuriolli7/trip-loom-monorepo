import type { DynamicStructuredTool } from "@langchain/core/tools";
import { requestCancellationTool } from "../request-cancellation";
import { requestPaymentTool } from "../request-payment";
import { suggestDestinationsTool } from "../suggest-destinations";
import { suggestFlightTool } from "../suggest-flight";
import { suggestHotelBookingTool } from "../suggest-hotel-booking";
import { suggestItineraryTool } from "../suggest-itinerary";

const SUPERVISOR_MCP_TOOLS = [
  "get_trip_details",
  "update_trip",
  "get_user_preferences",
] as const;

const DESTINATION_MCP_TOOLS = [
  "search_destinations",
  "get_destination_details",
  "get_recommended_destinations",
] as const;

const FLIGHT_MCP_TOOLS = [
  "search_flights",
  "book_flight",
  "cancel_flight_booking",
  "get_trip_details",
] as const;

const HOTEL_MCP_TOOLS = [
  "search_hotels",
  "create_hotel_booking",
  "cancel_hotel_booking",
  "get_trip_details",
] as const;

const ITINERARY_MCP_TOOLS = [
  "create_itinerary",
  "add_itinerary_day",
  "add_itinerary_activity",
  "update_itinerary_activity",
  "delete_itinerary_activity",
] as const;

/**
 * Single source of truth for tool ownership across all TripLoom agents.
 */
const AGENT_TOOL_REGISTRY = {
  supervisor: {
    mcp: SUPERVISOR_MCP_TOOLS,
    local: [requestPaymentTool, requestCancellationTool] as const,
  },
  destination: {
    mcp: DESTINATION_MCP_TOOLS,
    local: [suggestDestinationsTool] as const,
  },
  flight: {
    mcp: FLIGHT_MCP_TOOLS,
    local: [suggestFlightTool] as const,
  },
  hotel: {
    mcp: HOTEL_MCP_TOOLS,
    local: [suggestHotelBookingTool] as const,
  },
  itinerary: {
    mcp: ITINERARY_MCP_TOOLS,
    local: [suggestItineraryTool] as const,
  },
} as const;

type AgentRegistry = typeof AGENT_TOOL_REGISTRY;

export type AgentName = keyof AgentRegistry;
export type TripLoomMcpToolName = AgentRegistry[AgentName]["mcp"][number];
export type TripLoomLocalTool = AgentRegistry[AgentName]["local"][number];
export type TripLoomLocalToolName = TripLoomLocalTool["name"];
export type TripLoomToolName = TripLoomMcpToolName | TripLoomLocalToolName;

const TRIP_LOOM_LOCAL_TOOL_NAMES = [
  requestCancellationTool.name,
  requestPaymentTool.name,
  suggestDestinationsTool.name,
  suggestFlightTool.name,
  suggestHotelBookingTool.name,
  suggestItineraryTool.name,
] as const;

export const TRIP_LOOM_TOOL_NAMES = [
  ...SUPERVISOR_MCP_TOOLS,
  ...DESTINATION_MCP_TOOLS,
  ...FLIGHT_MCP_TOOLS,
  ...HOTEL_MCP_TOOLS,
  ...ITINERARY_MCP_TOOLS,
  ...TRIP_LOOM_LOCAL_TOOL_NAMES,
] as const;

function filterMcpTools(
  tools: DynamicStructuredTool[],
  names: readonly TripLoomMcpToolName[],
) {
  const nameSet = new Set<string>(names);
  return tools.filter((tool) => nameSet.has(tool.name));
}

export function getMcpToolsForAgent(
  allTools: DynamicStructuredTool[],
  agent: AgentName,
) {
  return filterMcpTools(allTools, AGENT_TOOL_REGISTRY[agent].mcp);
}

export function getLocalToolsForAgent(agent: AgentName) {
  return [...AGENT_TOOL_REGISTRY[agent].local];
}
