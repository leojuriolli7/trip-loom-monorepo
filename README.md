# TripLoom

AI travel assistant that plans and books trips through a single chat interface.

## What TripLoom Is

TripLoom combines a conversational UI with a multi-agent backend so users can:

- create and manage trips
- discover destinations
- search and book flights and hotels
- pay via Stripe
- generate and edit itineraries

In plain terms: users talk to one assistant, while specialized agents handle each domain behind the scenes.

## Current Scope

- Multi-agent orchestration with Supervisor + Destination + Flight + Hotel + Itinerary agents
- MCP server exposing TripLoom API operations as tools
- Human-in-the-loop actions for confirmations and payments
- Typed end-to-end contracts for tool names and MCP tool arguments
- Full-stack TypeScript monorepo (web, API, agents, MCP, contracts)

## Tech Stack

| Layer         | Technology                                                   |
| ------------- | ------------------------------------------------------------ |
| Frontend      | Next.js 16, React 19, Tailwind v4, Shadcn UI, TanStack Query |
| API           | Elysia (Bun), Drizzle ORM, PostgreSQL, Zod                   |
| Agents        | LangGraph.js + LangChain.js + OpenAI                         |
| MCP           | `@modelcontextprotocol/sdk`, Streamable HTTP transport       |
| Auth          | Better Auth (session + OAuth for MCP)                        |
| Payments      | Stripe                                                       |
| Observability | OpenTelemetry                                                |
| Monorepo      | pnpm workspaces                                              |

## Monorepo Layout

```text
apps/
  web/                Next.js product UI
  server/             Runtime host for @trip-loom/api
  mcp-server/         MCP server wrapping API endpoints as MCP tools

packages/
  api/                Elysia API engine (routes/services/mappers/db)
  agents/             LangGraph supervisor + domain agents + local tools
  contracts/          Shared DTO/enums contract package (single source of truth)
```

## System Overview

### Broad View

1. User sends a message in `apps/web`.
2. API streams the conversation through LangGraph agents.
3. Agents call MCP tools for TripLoom reads/writes and may call a few internal local tools for app-only capabilities.
4. MCP server calls API endpoints with user auth.
5. Frontend renders tool calls as cards and collects user confirmations/payments.

### Technical View

```text
Web (Next.js)
  -> API chat SSE endpoint (@trip-loom/api)
    -> LangGraph graph (@trip-loom/agents)
      -> MCP tools (apps/mcp-server)
        -> API REST routes (@trip-loom/api)
          -> PostgreSQL (Drizzle)
```

## Contracts and Types

`@trip-loom/contracts` is now the shared source for DTO and enum values.

- `packages/contracts/src/enums.ts` defines canonical enum values
- `packages/api/src/db/schema.ts` uses those enum values for `pgEnum(...)`
- API, web, MCP server, and agents import DTO/enums from `@trip-loom/contracts/*`
- MCP tool argument typing is mapped in `packages/agents/src/tools/core/mcp/types.ts`

Result: adding a new MCP tool requires registering the tool and adding its arg type map once in agents; frontend type narrowing follows from tool name.

## Local Development

```bash
# from repo root
pnpm db:up
pnpm db:migrate
pnpm db:seed

pnpm dev:server   # API host
pnpm dev:stripe   # Stripe local webhook handler
pnpm dev:mcp      # MCP server
pnpm dev:web      # Next.js app
```

## Project TODOs

### Agents and Orchestration

- [ ] Refine system prompts from real conversation test runs
- [ ] Wire PostgresStore: read/write user preferences namespaced by userId

### Quality and Observability

- [ ] Switch to `evlog` for structured logging + add logging and OpenTelemetry to agents and MCP
- [ ] Add eval suite for routing accuracy and tool-call correctness (choose eval framework: Evalite, LangSmith, or Vitest-based)
- [ ] Add RLS to DB + separate database pools and roles
    1. Split DB roles first.
      app_owner for migrations, app_runtime for normal API/MCP business queries, app_internal for
      Better Auth, OAuth token minting, Stripe webhooks, and LangGraph persistence.
    2. Stop using the owner connection for normal app queries.
      Your current drizzle.config.ts:5 can keep using the owner for migrations, but runtime code
      should move to a non-owner role.
    3. Add request-scoped DB context for authenticated business queries.
      Because the app uses one DB login, current_user is not enough. Use transaction-local
      set_config('app.user_id', ..., true) and policies that read current_setting('app.user_id',
      true).
    
    A safe shape is:

    ```ts
      await dbRuntime.transaction(async (tx) => {
        await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
        return runBusinessQuery(tx);
      });
    ```

### Data and Content

- [ ] Fix destination photos (some are SVG country flags, e.g., Monaco)
- [ ] Improve destination descriptions via AI (more about culture, less demographics, longer)
- [ ] Add more destinations worldwide -- at least 200+ -- Maldives, Arraial do Cabo, Trancoso, Porto de Galinhas, Maragogi, etc.)
- [ ] Add more hotels per destination from additional sources
- [ ] Remove data acquisition/generator scripts when data collection is complete

### Later

- [ ] Integrate itinerary with google maps: render map + routes for each day?
- [ ] File uploads -- images, pdfs
- [ ] Agents not using web-search enough: Destination agent + hotel agent for enrichment (Itinerary agent uses it fine)

### Nitpicks and Improvements

- [ ] Allow filtering by multiple amenities or highlights at once in list hotels/destinations
- [ ] Better "query" functionality for list endpoionts
- [ ] Option to book multiple hotels/flights for a trip
- [ ] Add option to share trip conversations (read-only)

## Package Documentation

- API engine: `packages/api/README.md`
- Agent system: `packages/agents/README.md`
- MCP server: `apps/mcp-server/README.md`
- Web app: `apps/web/README.md`
