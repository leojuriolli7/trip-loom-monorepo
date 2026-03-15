# TripLoom

_Your AI Travel Agent — plan and book entire trips in one chat._

TripLoom is a full-stack AI travel platform where you open a chat, describe what you want, and specialized agents handle everything: finding destinations, booking flights and hotels, processing real payments via Stripe, and building day-by-day itineraries backed by Google Maps data. The entire experience lives inside a single conversational interface, with agents rendering interactive UI widgets inline — destination carousels, hotel cards, airplane seat pickers, payment forms, and itinerary maps.

It's not a rigid wizard. Want to skip the hotel and jump straight to itinerary planning? Just say so. The system is composable, and the user guides the flow.

## Why This Project Exists

This is a research project built to go deep on the AI agent ecosystem. The goal was to understand — by building — how real AI systems work end-to-end: agent orchestration, tool design, human-in-the-loop flows, streaming architectures, MCP implementations, and how to make agents actually useful by giving them rich UI and real integrations.

## Highlights

- **Multi-agent orchestration** — LangGraph.js supervisor pattern with 4 specialized sub-agents, each with domain-specific tools, prompts, and web search capabilities
- **Full MCP server** — 23 tools, 6 resources, 5 prompts, OAuth 2.1 authentication. Any MCP-compatible client (Claude Desktop, Cursor, Codex) can interact with the platform
- **Generative UI** — 20+ React components rendered from agent tool calls: seat pickers, payment forms, map views, approval cards
- **Human-in-the-loop** — LangGraph `interrupt()` / `Command(resume)` for booking confirmations, cancellations, payments, and itinerary approvals
- **Real payments** — Stripe payment intents with webhook verification, refunds, and cancellation flows
- **Google Maps integration** — Places API for real venue data in itineraries, with interactive map views and route planning
- **End-to-end type safety** — Elysia Eden treaty client shared across frontend, MCP server, and agents. One type change propagates everywhere
- **Agent evals** — 18 evals testing routing, state management, blocking questions, and output quality against the full LangGraph supervisor graph with vitest-evals
- **Full observability** — OpenTelemetry tracing and structured logging across API, agents, and MCP server, all forwarded to any OTLP-compatible dashboard
- **Shared contracts** — Single `@trip-loom/contracts` package with 12 DTO schemas and 26 enums consumed by every service

## Tech Stack

| Layer                    | Technology                                                                 |
| ------------------------ | -------------------------------------------------------------------------- |
| **Frontend**             | Next.js 16, React 19, Tailwind CSS v4, Shadcn UI, TanStack Query v5, Jotai |
| **Backend API**          | Elysia on Bun, Drizzle ORM, PostgreSQL, Zod                                |
| **Auth**                 | Better Auth (session-based + OAuth 2.1 for MCP)                            |
| **Payments**             | Stripe (payment intents, webhooks, refunds)                                |
| **AI Agents**            | LangGraph.js, LangChain.js, OpenAI GPT-5.2                                 |
| **MCP Server**           | `@modelcontextprotocol/sdk`, Streamable HTTP transport, Elysia on Bun      |
| **Type-safe API client** | Elysia Eden treaty (shared across frontend, MCP server, and agents)        |
| **Observability**        | OpenTelemetry + structured logging (evlog) with OTLP drain                 |
| **Maps**                 | Google Maps Platform (Places API, Maps JavaScript API)                     |
| **Monorepo**             | pnpm workspaces                                                            |

## Architecture

### System Overview

```
User <-> Chat UI (Next.js) <-> API SSE endpoint (Elysia) <-> LangGraph Supervisor
                                                                     |
                                                           +---------+---------+---------+
                                                           |         |         |         |
                                                      Destination  Flight    Hotel    Itinerary
                                                        Agent      Agent     Agent     Agent
                                                         |           |         |         |
                                                         +-----+-----+---------+---------+
                                                               |
                                                          MCP Server
                                                               |
                                                        Eden Client -> API -> PostgreSQL
```

```
External MCP Clients (Claude Desktop, Cursor, etc.)
         |
    MCP Server (OAuth 2.1)
         |
  Eden Client -> API -> PostgreSQL
```

Both paths — the in-house chat UI and external MCP clients — connect through the same MCP server and share the same capabilities. The MCP server is the single integration point for all AI-driven interactions with the platform.

### Why the MCP Server Matters

External agents are going to be massive. A platform can't tie its AI capabilities exclusively to its internal agent — external agents need to interact with the platform too.

The MCP server is structured so that any MCP-compatible client gets the same power as the in-house agent, minus the custom UI. For example, when the in-house agent calls `create_hotel_booking`, the response includes a payment session with a Stripe client secret, and the frontend renders an inline payment form. When an external agent (like Claude Desktop) calls the same tool, it receives the same payment session but with a checkout URL it can direct the user to. Same API, same tool, different interaction model.

This is an intentional architectural decision: the MCP server is a generic, reusable API wrapper. The in-house agents add a UX layer on top.

### Three-Layer Tool Architecture

| Layer                | Lives in          | Purpose                                                                        | Examples                                                               |
| -------------------- | ----------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **MCP Tools**        | `apps/mcp-server` | Generic API wrappers. Reusable by any MCP client                               | `search_destinations`, `create_hotel_booking`, `search_places`         |
| **Agent Tools**      | `packages/agents` | UI-aware tools that emit structured data for the frontend to render as widgets | `suggest_destinations`, `suggest_flight`, `suggest_hotel_booking`      |
| **Frontend Actions** | `apps/web`        | Deterministic user-triggered actions. No AI involvement                        | "Pay" button creates Stripe intent, "Confirm" button resumes the graph |

**Why this split:**

- **MCP tools stay generic.** Other clients can use them without our UI. It's a clean API wrapper with full OAuth authentication
- **Agent tools encode UX decisions.** "Pick one hotel and present it as a card" is a UX choice, not an API operation. These tools return structured payloads that the frontend renders as interactive components
- **Payments and confirmations stay deterministic.** Payment amounts, currency, and booking IDs are never chosen by the LLM. The frontend derives them from the pending booking data. The AI's role is to create the booking and present it — the user and frontend handle the money

### End-to-End Type Safety

Every service communicates through the Elysia Eden treaty client, which provides compile-time type inference from the API route definition all the way to the consumer:

```ts
// apps/web/lib/api/api-client.ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

export const apiClient = treaty<App>(process.env.NEXT_PUBLIC_API_BASE_URL);
```

The same pattern is used in the MCP server (with OAuth bearer tokens) and the agents package. Change an API route's response shape and TypeScript catches every consumer that needs updating. No manual type synchronization, no runtime surprises.

React Query hooks are organized by domain (`trips.ts`, `flights.ts`, `hotels.ts`, etc.) with typed query/mutation option factories that derive their variable types directly from the Eden client signatures:

```ts
type TripsCall = ReturnType<typeof apiClient.api.trips>;

type CreateHotelBookingVars = {
  tripId: string;
  body: Parameters<TripsCall["hotels"]["post"]>[0];
};
```

### Shared Contracts

`@trip-loom/contracts` is the single source of truth for all DTO schemas and enum values across the monorepo:

- **12 DTO files** — Zod schemas for destinations, flights, hotels, bookings, payments, itineraries, weather, Google Maps places, and more
- **26 enum exports** — Trip status, cabin class, booking status, 154 hotel amenities, 34 hotel styles, 20 travel interests, 13 regions, 12 room types, and more
- **5 prompt definitions** — Reusable prompt templates for MCP prompts

Every service imports from this package. The API uses enum values for PostgreSQL `pgEnum()` definitions. The frontend uses them for form selects and filters. The MCP server uses Zod schemas for tool input validation. One change propagates everywhere.

## AI Agents

### Supervisor Pattern

The supervisor agent receives all user messages and routes to the appropriate specialist. It maintains conversation context, handles general questions, and suggests next steps after a sub-agent completes — but always follows the user's lead.

**MCP Tools:** `get_trip_details`, `get_user_preferences`, `update_trip`, `create_trip`

### Destination Agent

Finds and recommends travel destinations using search, personalized recommendations based on user preferences, and OpenAI web search for enrichment (visa requirements, weather, local events).

**MCP Tools:** `search_destinations`, `get_destination_details`, `get_recommended_destinations`, `get_weather`
**Agent Tools:** `suggest_destinations` (renders destination cards)

### Flight Agent

Searches flights, presents options with an interactive seat picker, handles booking with payment, and supports cancellation with refunds.

**MCP Tools:** `search_flights`, `create_flight_booking`, `cancel_flight_booking`, `get_trip_details`, `get_weather`
**Agent Tools:** `suggest_flight` (renders flight cards with seat selection)

### Hotel Agent

Searches hotels with filters (amenities, price range, rating, style), creates pending bookings, and presents them for payment approval. Uses web search for recent reviews and neighborhood info.

**MCP Tools:** `search_hotels`, `create_hotel_booking`, `cancel_hotel_booking`, `get_trip_details`, `get_weather`
**Agent Tools:** `suggest_hotel_booking` (renders hotel booking cards)

### Itinerary Agent

Builds day-by-day itineraries using Google Maps Places API for real venue data. Researches activities, restaurants, and attractions via web search. Plans around travel constraints (flight arrival times, hotel check-in/out).

**MCP Tools:** `search_places`, `get_place_details`, `create_itinerary`, `add_itinerary_day`, `add_itinerary_activity`, `update_itinerary_activity`, `delete_itinerary_activity`, `get_weather`

### LLM Configuration

Each agent's model is independently configurable via environment variables, defaulting to GPT-5.2. LangChain abstracts the provider, making it straightforward to swap to any supported model.

```
SUPERVISOR_MODEL=gpt-5.2
FLIGHT_AGENT_MODEL=gpt-5.2
HOTEL_AGENT_MODEL=gpt-5.2
DESTINATION_AGENT_MODEL=gpt-5.2
ITINERARY_AGENT_MODEL=gpt-5.2
```

## Human-in-the-Loop

LangGraph's `interrupt()` / `Command(resume)` pattern is used for all actions with real-world consequences:

1. Agent prepares an action (e.g., book a hotel for $450/night)
2. Graph execution pauses via `interrupt()` with the action details as payload
3. Frontend renders an approval widget (booking summary + confirm/deny buttons, or a Stripe payment form)
4. User approves or rejects
5. Graph resumes with the user's decision

**7 tools require approval:** `create_itinerary`, `add_itinerary_day`, `add_itinerary_activity`, `update_itinerary_activity`, `delete_itinerary_activity`, `cancel_hotel_booking`, `cancel_flight_booking`

**Booking and payment flows** use a separate interrupt pattern with inline Stripe payment forms. The agent creates a pending booking, the frontend renders the payment UI, and the graph resumes after payment confirmation via webhook.

## Generative UI

The agent renders **20+ interactive React components** based on tool calls:

| Component                         | Triggered By                                                 |
| --------------------------------- | ------------------------------------------------------------ |
| Destination suggestion cards      | `suggest_destinations` tool call                             |
| Flight comparison cards           | `suggest_flight` tool call                                   |
| Hotel booking cards with pricing  | `suggest_hotel_booking` tool call                            |
| Interactive airplane seat picker  | Seat selection interrupt                                     |
| Inline Stripe payment forms       | Booking payment interrupt                                    |
| Itinerary approval cards          | Itinerary mutation tool calls                                |
| Cancellation confirmation cards   | `cancel_hotel_booking`, `cancel_flight_booking`              |
| Destination search results        | `search_destinations` tool call                              |
| Flight search results             | `search_flights` tool call                                   |
| Hotel search results              | `search_hotels` tool call                                    |
| Trip details cards                | `get_trip_details` tool call                                 |
| Weather cards                     | `get_weather` tool call / tool result                        |
| Agent transfer indicators         | `transfer_to_*` tool calls                                   |
| Web search activity cards         | OpenAI web search provider                                   |
| Booking payment result cards      | `create_flight_booking`, `create_hotel_booking` tool results |
| Google Maps with itinerary places | Itinerary map view                                           |
| New trip suggestion cards         | `suggest_new_trip` tool call                                 |
| Destination detail cards          | `get_destination_details` tool call                          |
| Recommended destinations cards    | `get_recommended_destinations` tool call                     |
| User preferences cards            | `get_user_preferences` tool call                             |

Every tool call has a corresponding UI. The agent becomes the interface.

## MCP Server

A standalone TypeScript MCP server that wraps the TripLoom API. Any MCP-compatible client can use it to search destinations, book hotels, plan itineraries — all through the same API the in-house agent uses.

### Capabilities

| Capability    | Count | Examples                                                                                        |
| ------------- | ----- | ----------------------------------------------------------------------------------------------- |
| **Tools**     | 23    | `search_destinations`, `create_hotel_booking`, `search_places`, `get_weather`                   |
| **Resources** | 6     | `triploom://user/trips`, `triploom://trips/{tripId}`, `triploom://destinations/{destinationId}` |
| **Prompts**   | 5     | `explore_destinations`, `book_accommodations`, `plan_itinerary`                                 |

### Authentication

OAuth 2.1 with PKCE via Better Auth's MCP plugin. Every MCP session is scoped to an authenticated TripLoom user. The user's session token flows through to every API call, so all ownership guards apply — a user can never access another user's data through the MCP server.

### Transport

Streamable HTTP transport (`WebStandardStreamableHTTPServerTransport`) using Web Standard Request/Response APIs. Works natively with any framework that supports Web Standards.

### MCP Tools

| Tool                           | Description                                          | Agent         |
| ------------------------------ | ---------------------------------------------------- | ------------- |
| `get_trip_details`             | Full trip data with bookings, itinerary, destination | Supervisor    |
| `get_user_preferences`         | User travel preferences                              | Supervisor    |
| `update_trip`                  | Update trip dates, title, destination                | Supervisor    |
| `create_trip`                  | Create a new trip                                    | Supervisor    |
| `search_destinations`          | Search by text, region, country, highlights          | Destination   |
| `get_destination_details`      | Full destination info + related hotels               | Destination   |
| `get_recommended_destinations` | Personalized recommendations                         | Destination   |
| `search_flights`               | Search by route, date, cabin class                   | Flight        |
| `create_flight_booking`        | Create pending flight booking with payment session   | Flight        |
| `cancel_flight_booking`        | Cancel with refund                                   | Flight        |
| `search_hotels`                | Search with filters (amenities, price, rating)       | Hotel         |
| `create_hotel_booking`         | Create pending booking with payment session          | Hotel         |
| `cancel_hotel_booking`         | Cancel with refund                                   | Hotel         |
| `create_itinerary`             | Create itinerary with nested days + activities       | Itinerary     |
| `add_itinerary_day`            | Add a day to an existing itinerary                   | Itinerary     |
| `add_itinerary_activity`       | Add an activity to a day                             | Itinerary     |
| `update_itinerary_activity`    | Update an existing activity                          | Itinerary     |
| `delete_itinerary_activity`    | Remove an activity                                   | Itinerary     |
| `search_places`                | Google Maps place search for itinerary planning      | Itinerary     |
| `get_place_details`            | Detailed place info from Google Maps                 | Itinerary     |
| `get_weather`                  | Weather data for destinations                        | All           |
| `get_payment_session`          | Payment session for Stripe checkout                  | Booking flows |
| `ping`                         | Health check                                         | Utility       |

## Streaming

- **Transport:** SSE (Server-Sent Events) from a dedicated Elysia endpoint
- **Frontend:** `useStream` hook from `@langchain/langgraph-sdk/react` with native thread management, interrupt handling, and message state
- **Persistence:** PostgresSaver checkpointer. Each trip has an associated LangGraph thread. Conversations persist across sessions
- **Stream modes:** `messages` (token-by-token for typing effect) + `updates` (node execution) + `custom` (tool UI widget data)

## Observability

Full OpenTelemetry instrumentation across all three services, forwarding traces and structured logs to any OTLP-compatible dashboard (SigNoz included in Docker Compose).

### API Server

- `@elysiajs/opentelemetry` for automatic route tracing
- Structured logging via `evlog` with OTLP drain
- Auto-enrichment: user agent, request size, trace context
- Smart sampling: 100% for errors and payment/auth paths, 10% for info-level in production
- Slow request detection (>1s threshold)

### Agent System

- `@arizeai/openinference-instrumentation-langchain` instruments all LangGraph operations
- OTEL spans for: supervisor routing, sub-agent execution, tool calls, LLM invocations with token usage
- Structured agent lifecycle logging via `evlog`

### MCP Server

- `withToolLogging` wrapper around all 23 tool handlers
- Logs: tool name, sanitized args, duration, success/error status, trace IDs
- Automatic sensitive field redaction (passwords, tokens, card numbers)

## Backend API

Complete REST API with full CRUD for all domains, built with Elysia on Bun:

- **Trips** — Create, update, delete, list with computed status (draft/upcoming/current/past/cancelled)
- **Destinations** — Full-text search via PostgreSQL `tsvector`, filter by region/highlights, personalized recommendations
- **Hotels** — Search with 154 amenity filters, 34 style filters, price range, rating, full-text search
- **Flight Bookings** — Search, book with seat selection, cancel with refund
- **Hotel Bookings** — Create pending, confirm with payment, cancel with refund
- **Itineraries** — Create with nested days + activities, full CRUD per activity
- **Payments** — Stripe payment intents, webhook processing, refunds, partial refunds
- **User Preferences** — Travel interests, preferred regions, budget range, cabin class, dietary restrictions, accessibility needs
- **Auth** — Email/password, email verification, forgot password, session management
- **Google Maps** — Place search, place details, enriched place details

### Database

PostgreSQL with Drizzle ORM. **19 tables** covering users, auth (sessions, accounts, verification), OAuth (applications, tokens, consent), trips, destinations, airports, hotels, flight bookings, hotel bookings, payments, Stripe webhook events, itineraries with days and activities, and user preferences. **11 PostgreSQL enums** for type-safe domain values. Full-text search vectors on destinations and hotels.

### Agent Evals

**18 evaluation tests** across 5 eval files, powered by [vitest-evals](https://github.com/getsentry/vitest-evals). Evals invoke the **full LangGraph supervisor graph** — the real `buildSupervisor` with `MemorySaver`, mock tools, and mock sub-agents — so multi-step tool sequences (e.g., `update_trip` → `transfer_to_hotel_agent`) execute through the actual graph loop, not isolated LLM calls.

| Eval File                  | Tests | What It Validates                                                       |
| -------------------------- | ----- | ----------------------------------------------------------------------- |
| `routing.eval.ts`          | 7     | Supervisor delegates to the correct sub-agent per routing rules         |
| `state-management.eval.ts` | 4     | Trip state updates happen before delegation (destination, dates, title) |
| `weather.eval.ts`          | 3     | Supervisor handles forecasts directly, delegates climate questions      |
| `blocking.eval.ts`         | 2     | Supervisor asks for missing info instead of delegating prematurely      |
| `output-quality.eval.ts`   | 2     | Anti-parroting, brevity, no internal IDs exposed                        |

**Custom scorers:** `ToolSequenceScorer` (ordered tool call validation), `NoTransferScorer` (blocking question checks), `BrevityScorer` (anti-parroting heuristic), `LLMJudgeScorer` (GPT-4.1-mini as judge), `NoIDsExposedScorer` (ID leak detection).

```bash
pnpm eval           # run all evals
```

### Testing

**10 integration test files** with a shared test harness (`createTestContext`, `createTestApp`, `createJsonRequester`, `createHeaderAuthMock`). Tests run against an isolated `*_test` database auto-created from `DATABASE_URL`.

```bash
pnpm test:api
```

## Frontend

Next.js 16 with React 19, featuring:

- **Chat UI** — Full conversation view with streaming, tool call rendering, interrupt handling
- **Welcome screen** — Personalized greeting, user trips, recommended destinations
- **Auth flow** — Sign in, sign up, forgot password, email verification
- **Interactive widgets** — Airplane seat picker, Stripe payment forms, Google Maps with itinerary places
- **70+ stylized 3D icons** — Custom travel-themed icons for a distinctive visual identity
- **10 React Query domain files** — Type-safe data fetching for every API domain

## Monorepo Layout

```
apps/
  web/              Next.js 16 product UI
  server/           Runtime host for @trip-loom/api (Elysia on Bun)
  mcp-server/       MCP server wrapping API endpoints as tools

packages/
  api/              Elysia API engine (routes, services, mappers, db, auth, observability)
  agents/           LangGraph supervisor + 4 domain agents + local tools
  contracts/        Shared DTOs, enums, and prompt definitions
```

## UI Flow Examples

### Hotel Booking

```
User: "Find me a hotel"

1. Supervisor routes to Hotel Agent
2. Agent calls MCP: search_hotels(destinationId, priceRange)
   -> Frontend renders hotel search results card
3. Agent picks best match, calls MCP: create_hotel_booking(tripId, hotelId, dates, roomType)
   -> API creates PENDING booking, returns booking with payment session
4. Agent calls: suggest_hotel_booking({hotel, booking, totalPrice})
   -> Frontend renders hotel card with amenities, rating, pricing
5. Graph interrupts for payment
   -> Frontend renders inline Stripe payment form
6. User pays -> Webhook confirms -> Booking status: "confirmed"
7. Agent: "Hotel booked! Want to plan your itinerary?"
```

### Flight Booking with Seat Selection

```
User: "Book my flights"

1. Agent reads trip dates + destination, checks preferred departure airport
2. Agent calls MCP: search_flights(from, to, date, cabinClass)
   -> Frontend renders flight search results
3. Agent picks best flight, calls: suggest_flight({flight, suggestedSeat})
   -> Frontend renders flight card + interactive seat picker
4. User adjusts seat, clicks "Book"
5. Agent calls MCP: create_flight_booking(..., seatNumber)
   -> Graph interrupts for payment
   -> Frontend renders Stripe payment form
6. User pays -> Booking confirmed
7. Agent: "Outbound flight booked! Want to search for your return flight?"
```

### Itinerary Planning with Google Maps

```
User: "Plan my itinerary"

1. Agent reads trip details, existing bookings (flight times, hotel check-in/out)
2. Agent uses web search to research activities, restaurants, attractions
3. Agent calls MCP: search_places(query, destination) for real venue data
4. Agent calls MCP: create_itinerary({days with activities})
   -> Graph interrupts for user approval
   -> Frontend renders itinerary approval card
5. User approves -> Itinerary saved
6. Frontend renders interactive map with itinerary places and route planning
```

### Cancellation with Confirmation

```
User: "Cancel my hotel booking"

1. Agent calls MCP: get_trip_details(tripId) -> finds the booking
2. Graph interrupts with cancellation details
   -> Frontend renders: "Cancel Marriott? You'll be refunded $450." [Confirm] [Keep]
3. User clicks "Confirm" -> Graph resumes
4. Agent calls MCP: cancel_hotel_booking(tripId, bookingId)
   -> API processes refund via Stripe
5. Agent: "Done. Refund will appear in 5-10 business days."
```

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Bun
- PostgreSQL (via Docker Compose)

### Running Locally

```bash
# Start database
pnpm db:up

# Run migrations and seed
pnpm db:migrate
pnpm db:seed

# Start all services
pnpm dev:server      # API on port 3001
pnpm dev:stripe      # Stripe webhook listener
pnpm dev:mcp         # MCP server on port 3002
pnpm dev:web         # Next.js on port 3000

# Optional: Start observability stack (SigNoz)
pnpm docker:up       # Includes SigNoz UI on port 8080
```

### Testing

```bash
pnpm test:api        # API integration tests (isolated test database)
pnpm eval            # Agent evals (full graph execution, requires OPENAI_API_KEY)
pnpm test:e2e        # Playwright E2E tests
```

## Package Documentation

Each package and app has its own detailed README:

- **API engine:** [`packages/api/README.md`](packages/api/README.md)
- **Agent system:** [`packages/agents/README.md`](packages/agents/README.md)
- **MCP server:** [`apps/mcp-server/README.md`](apps/mcp-server/README.md)
- **Web app:** [`apps/web/README.md`](apps/web/README.md)

Additional documentation:

- **Booking payment flow:** [`docs/api/booking-payment-flow.md`](docs/api/booking-payment-flow.md)
- **Cancellation and refund policy:** [`docs/api/cancellation-refund-policy.md`](docs/api/cancellation-refund-policy.md)
- **Trip lifecycle:** [`docs/api/trip-lifecycle.md`](docs/api/trip-lifecycle.md)
- **Itinerary lifecycle:** [`docs/api/itinerary-lifecycle.md`](docs/api/itinerary-lifecycle.md)
- **AI booking flow:** [`docs/ai/ai-booking-flow.md`](docs/ai/ai-booking-flow.md)
- **Tool approval system:** [`docs/ai/tool-approval.md`](docs/ai/tool-approval.md)

## Project TODOs

### Agents and Orchestration

- [ ] Wire PostgresStore: read/write user preferences namespaced by userId

### Release

- [ ] Write more Playwright E2E Tests
- [ ] Deployments of API, Web and MCP Server
- [ ] Analyze MCP server reconnection handling on the API Side
- [ ] Adjust rate limits based on headers (Have CDN clean up first)
- [ ] Wire up Observability Platform

### Later Features

- [ ] Conversation minimap for Current, Draft, etc states. [Inspiration](https://x.com/raunofreiberg/status/2031794945896378820) — Example: "Finding a destination" -> "Planning" -> "During Trip" -> "Post-Trip"
- [ ] File uploads — images, pdfs
- [ ] Allow filtering by multiple amenities or highlights at once in list hotels/destinations
- [ ] Better "query" functionality for list endpoionts
- [ ] Option to book multiple hotels/flights for a trip
- [ ] Add option to share trip conversations (read-only)
