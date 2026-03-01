import { randomUUID } from "node:crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import {
  WebStandardStreamableHTTPServerTransport,
  type WebStandardStreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { mcpAuthMiddleware, discoveryRoutes } from "./auth";
import { createMcpServer } from "./server";

const app = new Hono();

// Transport map: sessionId -> transport instance
const transports: Record<string, WebStandardStreamableHTTPServerTransport> = {};

// Mount OAuth 2.1 discovery endpoints (.well-known/*)
const MCP_SERVER_PORT = process.env.MCP_SERVER_PORT ?? "3002";
const MCP_SERVER_URL = `http://localhost:${MCP_SERVER_PORT}`;
discoveryRoutes(app, MCP_SERVER_URL);

// Auth middleware on all /mcp routes
app.use("/mcp/*", mcpAuthMiddleware);
app.use("/mcp", mcpAuthMiddleware);

// All MCP methods (POST, GET, DELETE) on a single route
// WebStandardStreamableHTTPServerTransport handles routing internally
app.all("/mcp", async (c) => {
  const sessionId = c.req.header("mcp-session-id");

  try {
    // Existing session — reuse transport
    if (sessionId && transports[sessionId]) {
      return transports[sessionId].handleRequest(c.req.raw);
    }

    // Non-POST without a session is always invalid (GET/DELETE need a session)
    if (c.req.method !== "POST") {
      return c.text("Invalid or missing session ID", 400);
    }

    // POST without session — parse body to check if it's initialization
    const body = await c.req.json();

    if (!isInitializeRequest(body)) {
      return c.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID",
          },
          id: null,
        },
        400,
      );
    }

    // New initialization — create transport + server
    const options: WebStandardStreamableHTTPServerTransportOptions = {
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
      },
    };

    const transport = new WebStandardStreamableHTTPServerTransport(options);

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid && transports[sid]) {
        delete transports[sid];
      }
    };

    const server = createMcpServer();
    await server.connect(transport);

    // Pass pre-parsed body since we already consumed the stream
    return transport.handleRequest(c.req.raw, { parsedBody: body });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      },
      500,
    );
  }
});

// Start server
const port = Number.parseInt(MCP_SERVER_PORT, 10);

console.log(`TripLoom MCP server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down MCP server...");
  for (const sessionId in transports) {
    await transports[sessionId].close();
    delete transports[sessionId];
  }
  process.exit(0);
});
