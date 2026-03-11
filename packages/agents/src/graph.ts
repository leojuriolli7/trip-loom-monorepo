import { createMcpClient, loadMcpTools, readMcpResources } from "./mcp-client";
import type { McpResources } from "./mcp-client";
import { createModel, modelConfig } from "./config";
import { createCheckpointer, createStore } from "./persistence";
import { createDestinationAgent } from "./sub-agents/destination";
import { createFlightAgent } from "./sub-agents/flight";
import { createHotelAgent } from "./sub-agents/hotel";
import { createItineraryAgent } from "./sub-agents/itinerary";
import { buildSupervisor } from "./supervisor";
import {
  APPROVAL_REQUIRED_TOOLS,
  getLocalToolsForAgent,
  getMcpToolsForAgent,
} from "./tools";
import {
  createFlightBookingFlowTool,
  createHotelBookingFlowTool,
} from "./tools/booking-flow";
import { withApproval } from "./tools/core/with-approval";
import { tools as openaiTools } from "@langchain/openai";
import type { MultiServerMCPClient } from "@langchain/mcp-adapters";

export interface GraphConfig {
  /** MCP server URL (e.g. http://localhost:3002/mcp) */
  mcpUrl: string;
  /** User-scoped OAuth access token for MCP authentication */
  accessToken: string;
  /** PostgreSQL connection string for checkpointer + store */
  dbConnectionString: string;
}

export interface GraphInstance {
  /** Compiled graph ready for .stream() or .invoke() */
  graph: ReturnType<typeof buildSupervisor>;
  /** MCP client — call close() when done to clean up connections */
  mcpClient: MultiServerMCPClient;
  /** Pre-loaded MCP resources (user trips + preferences) */
  mcpResources: McpResources;
}

/**
 * Creates the full agent graph: MCP client → sub-agents → supervisor.
 *
 * This is the main entry point for the agent system. The API layer calls
 * this with a user-scoped access token, then streams the graph output as SSE.
 *
 * The caller is responsible for closing the MCP client when the stream ends
 * (via `mcpClient.close()`).
 */
export async function createGraph(config: GraphConfig): Promise<GraphInstance> {
  const { mcpUrl, accessToken, dbConnectionString } = config;

  // 1. Connect to MCP, load tools and read resources in parallel
  const mcpClient = createMcpClient({ mcpUrl, accessToken });
  const [rawTools, mcpResources] = await Promise.all([
    loadMcpTools(mcpClient),
    readMcpResources(mcpClient),
  ]);

  // Wrap approval-required MCP tools with interrupt-based confirmation
  const allTools = rawTools.map((t) =>
    APPROVAL_REQUIRED_TOOLS.has(t.name) ? withApproval(t) : t,
  );
  const createHotelBookingMcpTool = allTools.find(
    (tool) => tool.name === "create_hotel_booking",
  );
  const createFlightBookingMcpTool = allTools.find(
    (tool) => tool.name === "create_flight_booking",
  );

  if (!createHotelBookingMcpTool || !createFlightBookingMcpTool) {
    throw new Error("Required booking MCP tools could not be loaded");
  }

  // 2. Create persistence layer
  const checkpointer = createCheckpointer(dbConnectionString);
  const store = createStore(dbConnectionString);

  // 3. Create sub-agents with MCP tools + local presentation/HITL tools + web search
  const webSearch = openaiTools.webSearch();

  const destinationAgent = createDestinationAgent(
    [
      ...getMcpToolsForAgent(allTools, "destination"),
      ...getLocalToolsForAgent("destination"),
      webSearch,
    ],
    createModel(modelConfig.destination),
  );
  const flightAgent = createFlightAgent(
    [
      ...getMcpToolsForAgent(allTools, "flight").filter(
        (tool) => tool.name !== "create_flight_booking",
      ),
      createFlightBookingFlowTool(createFlightBookingMcpTool),
      ...getLocalToolsForAgent("flight"),
    ],
    createModel(modelConfig.flight),
  );
  const hotelAgent = createHotelAgent(
    [
      ...getMcpToolsForAgent(allTools, "hotel").filter(
        (tool) => tool.name !== "create_hotel_booking",
      ),
      createHotelBookingFlowTool(createHotelBookingMcpTool),
      ...getLocalToolsForAgent("hotel"),
      webSearch,
    ],
    createModel(modelConfig.hotel),
  );
  const itineraryAgent = createItineraryAgent({
    tools: [
      ...getMcpToolsForAgent(allTools, "itinerary"),
      ...getLocalToolsForAgent("itinerary"),
      webSearch,
    ],
    llm: createModel(modelConfig.itinerary),
    pastItineraries: mcpResources.userItineraries,
  });

  // 4. Build and compile the supervisor graph
  const graph = buildSupervisor({
    agents: [destinationAgent, flightAgent, hotelAgent, itineraryAgent],
    tools: [
      ...getMcpToolsForAgent(allTools, "supervisor"),
      ...getLocalToolsForAgent("supervisor"),
    ],
    llm: createModel(modelConfig.supervisor),
    checkpointer,
    store,
  });

  return { graph, mcpClient, mcpResources };
}

/**
 * Reads the conversation state for a given thread from the checkpointer.
 * Used to load chat history when a user returns to an existing conversation.
 */
export async function getThreadState(
  dbConnectionString: string,
  threadId: string,
) {
  const checkpointer = createCheckpointer(dbConnectionString);
  return checkpointer.getTuple({
    configurable: { thread_id: threadId },
  });
}
