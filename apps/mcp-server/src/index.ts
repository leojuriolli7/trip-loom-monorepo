import { randomUUID } from "node:crypto";
import { Elysia } from "elysia";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import {
  WebStandardStreamableHTTPServerTransport,
  type WebStandardStreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { mcpAuth } from "./auth";
import { createMcpServer } from "./server";

// Transport map: sessionId -> transport instance
const transports: Record<string, WebStandardStreamableHTTPServerTransport> = {};

const MCP_SERVER_PORT = process.env.MCP_SERVER_PORT ?? "3002";
const MCP_SERVER_URL = `http://localhost:${MCP_SERVER_PORT}`;

const discoveryHandler = mcpAuth.discoveryHandler();
const protectedResourceHandler = mcpAuth.protectedResourceHandler(MCP_SERVER_URL);

// Authenticated MCP handler — mcpAuth.handler wraps with Bearer token validation.
// Returns 401 with WWW-Authenticate header if token is missing/invalid.
const handleMcp = mcpAuth.handler(async (request, session) => {
  const sessionId = request.headers.get("mcp-session-id");

  try {
    // Existing session — reuse transport
    if (sessionId && transports[sessionId]) {
      return transports[sessionId].handleRequest(request);
    }

    // Non-POST without a session is always invalid (GET/DELETE need a session)
    if (request.method !== "POST") {
      return new Response("Invalid or missing session ID", { status: 400 });
    }

    // POST without session — parse body to check if it's initialization
    const body = await request.json();

    if (!isInitializeRequest(body)) {
      return Response.json(
        {
          jsonrpc: "2.0",
          error: { code: -32000, message: "Bad Request: No valid session ID" },
          id: null,
        },
        { status: 400 },
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

    const server = createMcpServer(session.accessToken);
    await server.connect(transport);

    // Pass pre-parsed body since we already consumed the stream
    return transport.handleRequest(request, { parsedBody: body });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    return Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      },
      { status: 500 },
    );
  }
});

new Elysia()
  // OAuth 2.1 discovery endpoints (.well-known/*)
  .get("/.well-known/oauth-authorization-server", async ({ request }) =>
    discoveryHandler(request),
  )
  .get("/.well-known/oauth-protected-resource", async ({ request }) =>
    protectedResourceHandler(request),
  )
  // All MCP methods (POST, GET, DELETE) on a single authenticated route
  .all("/mcp", ({ request }) => handleMcp(request))
  .listen(Number.parseInt(MCP_SERVER_PORT, 10));

console.log(`TripLoom MCP server running on http://localhost:${MCP_SERVER_PORT}`);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down MCP server...");
  for (const sessionId in transports) {
    await transports[sessionId].close();
    delete transports[sessionId];
  }
  process.exit(0);
});
