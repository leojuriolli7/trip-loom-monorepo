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
3. Agents call MCP tools for data reads/writes.
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

### Product and UX
- [x] Airplane seat picker flow and flight-specific tools. Done but some feedback:
  - [ ] The suggested flights card should separate outbound list from inbound list
  - [ ] Any way to render price of flight inside airplane seat viewer?
- [ ] Itinerary cards: Same card dealing with created + updated with streaming handling: While tool is streaming, render loading message to tool card
- [ ] Improve UI per trip stage: upcoming/current/past with different widgets visible (like weather widget -- or `get_weather` tool?), for completed trip block chat and show a widget talking about how trip was over, "how was your trip?" feedback card for emailing us + CTA to start planning a new trip...
- [ ] Agents not using web-search enough -- especially itinerary agent
- [ ] Get trip details card can just open a global trip details sheet, instead of collapsible each time, to save on DOM size. Plus show quick itinerary summary in itinerary section: "N activities planned" is enough. then we can have a button on topbar to toggle this sheet too + delete button + archive button 
- [ ] Update sidebar to render all trips together with a badge distinguishing status + archived section
- [ ] Destination suggestions comes with custom descriptions. this needs to be highlighted in some way. Currently, the description is cut off by the char limit in the destination-card. We could rework the ui to not use carousels or add a tooltip to destination-card.
- [ ] Add follow-up suggestion prompts above chat input
- [ ] Allow filtering by multiple amenities or highlights at once in. list hotels/destinations
- [ ] Option to book multiple hotels/flights for a trip
- [ ] Add images and sources for each activity for itineraries
- [ ] Inconsistent "payment succesful" card: sometimes is visible immediately. Other times it's not visible during chat when payment finalizes, form disappears and card confirming it doesn't appear but appears after chat history refresh -- it should appear immediately.


### Agents and Orchestration

- [ ] Refine system prompts from real conversation test runs
- [ ] Read MCP resources and tools more, eg: Check user past trips for context before proceeding, call get_trip_details and so on...
- [ ] Wire PostgresStore: read/write user preferences namespaced by userId
- [ ] Add integration with MCP prompts and more in each component: Destination details dialog, greetings page suggestion cards, etc...

### Quality and Observability

- [ ] Add eval suite for routing accuracy and tool-call correctness (choose eval framework: Evalite, LangSmith, or Vitest-based)
- [ ] Expand web E2E coverage (Playwright)
- [ ] Add OpenTelemetry spans for agent and MCP execution
- [ ] Add structured logging coverage for agents messages and tools + MCP tools
- [ ] Add CI workflow for typecheck/tests on PRs
- [ ] API rate limits + DB RLS

### Data and Content

- [ ] Fix destination photos (some are SVG country flags, e.g., Monaco)
- [ ] Improve destination descriptions via AI (more about culture, less demographics, longer)
- [ ] Add more destinations worldwide -- at least 200+ -- Maldives, Arraial do Cabo, Trancoso, Porto de Galinhas, Maragogi, etc.)
- [ ] Add more hotels per destination from additional sources
- [ ] Remove data acquisition/generator scripts when data collection is complete

### Platform and Payments

- [ ] Add option to share trip conversations (read-only)
- [ ] Evaluate optional auto-pay flows vs explicit manual payment each time (eg: Allow always, allow, deny...)
- [ ] Add persistent "always use this airport" preference in flight confirmation

## Package Documentation

- API engine: `packages/api/README.md`
- Agent system: `packages/agents/README.md`
- MCP server: `apps/mcp-server/README.md`
- Web app: `apps/web/README.md`
