# TripLoom MCP Server

Standalone MCP (Model Context Protocol) server that exposes TripLoom API capabilities as tools for AI agents. Uses Streamable HTTP transport and OAuth 2.1 authentication via Better Auth.

## Running Locally

```bash
# From the monorepo root — requires the API server running on port 3001
pnpm dev:server  # in one terminal
pnpm dev:mcp     # in another terminal
```

The MCP server starts on `http://localhost:3002` (configurable via `MCP_SERVER_PORT`).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_BASE_URL` | Yes | — | TripLoom API URL (e.g., `http://localhost:3001`) |
| `MCP_SERVER_PORT` | No | `3002` | Port for the MCP server |

Copy `.env.example` to `.env` and fill in values.

## Authentication

The MCP server uses OAuth 2.1 via Better Auth's MCP plugin:

1. The API (`packages/api`) acts as the **OAuth Authorization Server** — it handles login, consent, and token issuance
2. The MCP server acts as the **Resource Server** — it validates Bearer tokens on every request
3. MCP clients obtain tokens through the standard OAuth 2.1 authorization code flow with PKCE

### Discovery Endpoints (unauthenticated)

- `GET /.well-known/oauth-protected-resource` — resource metadata (points clients to the auth server)
- `GET /.well-known/oauth-authorization-server` — proxied auth server metadata from the API

### MCP Endpoint (authenticated)

All methods require a valid Bearer token in the `Authorization` header.

- `POST /mcp` — JSON-RPC messages (initialize session or send requests)
- `GET /mcp` — SSE stream for server-initiated messages (requires `Mcp-Session-Id` header)
- `DELETE /mcp` — session termination (requires `Mcp-Session-Id` header)

Unauthenticated requests receive a `401` response with a `WWW-Authenticate: Bearer resource_metadata="..."` header for automatic discovery.

### OAuth Flow

```
1. MCP Client → GET /.well-known/oauth-protected-resource
   ← { resource, authorization_servers: ["http://localhost:3001/auth"] }

2. MCP Client → GET http://localhost:3001/.well-known/oauth-authorization-server/auth
   ← { authorization_endpoint, token_endpoint, registration_endpoint, ... }

3. MCP Client → POST http://localhost:3001/auth/mcp/register  (Dynamic Client Registration)
   ← { client_id, ... }

4. MCP Client → redirect user to http://localhost:3001/auth/mcp/authorize?client_id=...&code_challenge=...
   → User logs in at frontend (/enter), approves consent
   ← Redirect back with authorization code

5. MCP Client → POST http://localhost:3001/auth/mcp/token  (exchange code for token)
   ← { access_token, refresh_token, ... }

6. MCP Client → POST /mcp with Authorization: Bearer <access_token>
   ← MCP responses (tools, resources, prompts)
```

## Architecture

```
MCP Client (e.g., Claude Desktop, LangGraph agent)
    |
    | Bearer token (OAuth 2.1)
    v
MCP Server (Hono + Streamable HTTP, port 3002)
    |
    | Eden client (type-safe)
    v
TripLoom API (Elysia, port 3001)
```

## Testing with Claude Desktop

Claude Desktop requires `mcp-remote` as a stdio-to-HTTP bridge. Add the following to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "triploom": {
      "command": "/path/to/node20/bin/npx",
      "args": ["mcp-remote", "http://localhost:3002/mcp"],
      "env": {
        "PATH": "/path/to/node20/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
      }
    }
  }
}
```

Replace `/path/to/node20/bin` with your Node 20+ binary path (e.g., `~/.nvm/versions/node/v20.19.0/bin`). The `PATH` env ensures `mcp-remote` runs with a compatible Node version.

Make sure both the API server and MCP server are running. On first connection, `mcp-remote` will open a browser window for you to log in. To reset the OAuth state, delete `~/.mcp-auth/`.

## Available Tools

| Tool | Description |
|------|-------------|
| `ping` | Health check — returns "pong" |

More tools will be added as the MCP server is built out (destinations, flights, hotels, itineraries, payments).
