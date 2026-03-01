# TripLoom

*Your AI Travel Agent — plan & book everything in one place.*

## What is TripLoom?

TripLoom is a full-stack AI travel assistant. You open a chat, tell it where you want to go (or ask for suggestions), and it handles the rest: finding destinations, booking flights and hotels, processing payments, and building a day-by-day itinerary — all through a conversational interface powered by multiple specialized AI agents.

The entire experience lives inside a single chat UI. Agents suggest options through rich UI widgets (destination carousels, hotel cards, seat pickers, payment forms), and the user guides the flow. Want to skip the hotel and jump straight to itinerary planning? Just say so. The system is composable, not a rigid step-by-step wizard.

**Key highlights:**
- Multiple AI agents orchestrated with LangGraph, each specialized in one domain
- MCP (Model Context Protocol) server exposing all API capabilities as tools
- Real payments via Stripe
- Rich, interactive tool-call UI widgets embedded in the chat
- Fully type-safe from database to API to frontend (Drizzle + Elysia Eden + TypeScript)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Shadcn UI, Tailwind CSS v4, Jotai, TanStack Query v5 |
| **Backend API** | Elysia (Bun runtime), Drizzle ORM, PostgreSQL, Zod v4 |
| **Auth** | Better Auth (session-based, email/password, email verification, forgot password) |
| **Payments** | Stripe (payment intents, webhooks, refunds) |
| **AI Agents** | LangGraph.js, LangChain.js, OpenAI GPT-5.2 |
| **MCP Server** | @modelcontextprotocol/sdk (TypeScript) |
| **Type-safe API Client** | Elysia Eden treaty (shared across frontend, MCP server, and agents) |
| **Observability** | OpenTelemetry (tracing via SigNoz) |
| **Monorepo** | pnpm workspaces |

## What's Built

### Backend API (`packages/api` and `apps/server`)

Complete REST API with full CRUD for all domains:

- **Trips** — Create, update, delete, list (with computed status: draft/upcoming/current/past/cancelled)
- **Destinations** — Search (full-text via tsvector), filter by region/highlights, personalized recommendations
- **Hotels** — Search with filters (amenities, styles, price range, rating), full-text search
- **Hotel Bookings** — Create (pending), confirm (with payment), cancel
- **Flight Bookings** — Search, book inbound/outbound flights, cancel
- **Itineraries** — Create per-trip, manage days and activities with ordering
- **Payments** — Stripe payment intents, webhook processing, refunds
- **User Preferences** — Travel interests, preferred regions, budget range, cabin class, dietary restrictions, accessibility needs
- **Auth** — Sign up, sign in, email verification, forgot password, session management

All routes are fully typed with Elysia + Zod schemas. The Eden treaty client provides end-to-end type inference from API definition to frontend consumption.

The API is hosted on `apps/server` as a standalone Elysia API running on Bun.

### Frontend (`apps/web`)

- **Chat UI** — Shell layout with sidebar, topbar, input panel, conversation view
- **Welcome Screen** — Personalized greeting, user's trips section, recommended destinations with detail dialogs
- **Auth Flow** — Sign in, sign up, forgot password, email verification
- **AI UI Components** — 40+ pre-built components (conversation, message, tool, code-block, confirmation, etc.) ready for integration
- **Interactive Widgets** — Airplane seat picker (proof of concept for tool-call UI)
- **API Integration** — React Query hooks for every API domain, Eden client configured
- **Dev Tools** — API CRUD wizard page for testing all endpoints

### Database

PostgreSQL with Drizzle ORM. 15 tables covering users, auth, trips, destinations, hotels, airports, bookings (hotel + flight), payments, itineraries (with days and activities), user preferences, and Stripe webhook events. Rich enum types for trip status, cabin class, booking status, amenities, hotel styles, room types, regions, travel interests, and price ranges. Full-text search vectors on destinations and hotels.

## AI Architecture

### Overview

The AI system follows a **supervisor multi-agent pattern** built with LangGraph.js. A central supervisor agent receives all user messages and delegates to specialized sub-agents based on the user's intent. Each sub-agent has access to domain-specific tools exposed through an MCP server, which communicates with the API via the type-safe Eden client.

```
User <-> Chat UI <-> API (SSE endpoint) <-> LangGraph Supervisor
                                                    |
                                          +---------+---------+
                                          |         |         |
                                     Destination  Flight    Hotel    Itinerary
                                      Agent      Agent     Agent     Agent
                                          |         |         |         |
                                          +---------+---------+---------+
                                                    |
                                              MCP Server
                                                    |
                                           Eden Client -> API
```

### Agents

#### Supervisor Agent (Router)
- Receives all user messages and determines which specialized agent should handle the request
- Handles general conversation (greetings, clarifications, trip status questions)
- Maintains the overall conversation flow and decides when to hand off or take back control
- Can access trip and user preference resources for context
- Suggests next steps after a sub-agent completes (e.g., "Now that your hotel is booked, want to plan your itinerary?") but follows the user's lead

#### Destination Search Agent
- **Purpose:** Help users find and choose a travel destination
- **MCP Tools:** `searchDestinations`, `getDestinationDetails`, `getRecommendedDestinations`
- **Web Search:** Enrich destination data with current travel info, visa requirements, weather, events
- **Context:** Reads user preferences (travel interests, preferred regions, budget) to personalize suggestions
- **UI Widgets:** Destination carousel cards with photos, highlights, and "Select" buttons

#### Flight Booking Agent
- **Purpose:** Search and book inbound/outbound flights for a trip
- **MCP Tools:** `searchFlights`, `bookFlight`, `cancelFlightBooking`
- **Context:** Uses trip dates (start date = inbound, end date = outbound) and destination to derive search parameters. Reads user's preferred departure airport from preferences and confirms with the user before searching (e.g., "Based on your preferences, are you flying out of JFK?").
- **Human-in-the-loop:** Interrupt before booking — present the AI's suggested flight with seat selection widget, then payment confirmation. User can request different options via chat.
- **UI Widgets:** Flight suggestion card, airplane seat picker, Stripe payment form

#### Hotel Booking Agent
- **Purpose:** Search and book hotel accommodations
- **MCP Tools:** `searchHotels`, `createHotelBooking`, `cancelHotelBooking`
- **Web Search:** Enrich hotel data with recent reviews, photos, neighborhood info
- **Context:** Uses trip dates for check-in/check-out, destination for location filtering, user budget/style preferences
- **Flow:** Agent searches hotels, picks the best match based on user preferences, selects a room type (e.g., "standard" for budget travelers), and creates a pending booking. The booking card is presented to the user with pricing. User can approve and pay, or request changes via chat (different hotel, different room type, etc.). If user declines, the pending booking is deleted.
- **Human-in-the-loop:** Interrupt before payment — present the suggested booking, then Stripe payment form upon approval
- **UI Widgets:** Hotel suggestion card with amenities/rating/pricing, Stripe payment form

#### Itinerary Planner Agent
- **Purpose:** Create and modify day-by-day trip itineraries
- **MCP Tools:** `createItinerary`, `addItineraryDay`, `addItineraryActivity`, `updateItineraryActivity`, `deleteItineraryActivity`
- **Web Search:** Research activities, restaurants, local attractions, opening hours, estimated costs
- **Context:** Uses trip dates, destination, and existing bookings (check-in times, flight arrivals) to plan around constraints
- **UI Widgets:** Day-by-day itinerary view, activity cards with times/locations/costs, itinerary diff viewer for edits

### Conversation Persistence

Each trip has an associated LangGraph thread. The approach:

- **LangGraph Checkpointer** (PostgresSaver): Persists full graph state at every step, enabling interrupt/resume for human-in-the-loop flows and conversation continuity across sessions
- **Trip-linked thread:** The `trip` table stores a `threadId` that maps to the LangGraph thread, plus a `messages` jsonb column for fast message display without querying the checkpointer
- **Cross-session memory:** LangGraph's Store (namespaced by user ID) can persist learned user preferences across different trip conversations

### Human-in-the-Loop

LangGraph's `interrupt()` / `Command(resume=...)` pattern is used for all approval flows:

1. Agent prepares an action (e.g., book a hotel for $450/night)
2. Graph execution pauses via `interrupt()` with the action details as payload
3. Frontend renders an approval widget (booking summary + confirm/deny buttons, or a Stripe payment form)
4. User approves/denies
5. Graph resumes with the user's decision via `Command(resume=...)`

This is used for: booking confirmations, payment processing, destination selection, itinerary approval, and any action with real-world consequences.

### Streaming

- **Transport:** SSE (Server-Sent Events) — the standard for LangGraph web apps. Simpler than WebSockets, natively supported by browsers, and sufficient since LLM streaming is server-to-client
- **API Endpoint:** A dedicated streaming endpoint in the Elysia API that invokes the LangGraph graph and pipes SSE events to the client
- **Frontend:** `useStream` hook from `@langchain/langgraph-sdk/react` for LangGraph-native streaming with thread management, interrupt handling, and message state. Alternative: Vercel AI SDK v6 `useChat` with the `@ai-sdk/langchain` adapter
- **Stream Modes:** Combining `messages` (token-by-token for typing effect) + `updates` (node execution tracking) + `custom` (tool UI widget data)

### LLM

OpenAI GPT-5.2 as the primary model (95%+ tool-calling success rate, strong multi-step reasoning). LangChain abstracts the provider, making it trivial to swap to Anthropic Claude, o3-mini (budget alternative), or any other supported model.

## MCP Server

A standalone TypeScript MCP server (`@modelcontextprotocol/sdk`) that wraps the TripLoom API. Agents connect to it for all API interactions. Internally, every tool implementation calls the API via the type-safe Eden client.

The server will live in `apps/mcp-server` and use: 

- Bun
- Express (or Elysia depending on existing documentation and support -- Elysia and Bun only require standard Request and Response to work)
- Typescript MCP SDK
- OAuth 2.1, with our API using better-auth's OAuth Plugin to integrate it
- Elysia's Eden Client, a typesafe client for calling API endpoints in tools: 

```ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

export const apiClient = treaty<App>(process.env.API_URL, {
  parseDate: false,
  // Required for cross-origin cookie sending (mcp server on :3002, API on :3001)
  fetch: { credentials: "include" },
})
```

### Authentication

The MCP server requires an authenticated TripLoom user session. The authenticated user's session token is passed through to every Eden client call, so all API-level ownership guards apply — a user can never access or mutate another user's trips, bookings, itineraries, or preferences through the MCP server. The API already enforces this: every user-scoped route checks `trip.userId` (or joins through trip for sub-resources like bookings and payments), and public catalog endpoints (destinations, hotels) correctly skip auth.

### Tools

Tools are model-controlled actions the agents can invoke:

| Tool | Description | Agent(s) |
|------|-------------|----------|
| `searchDestinations` | Search destinations by text, region, highlights | Destination |
| `getDestinationDetails` | Get full destination info with enrichment | Destination |
| `getRecommendedDestinations` | Get personalized recommendations based on user preferences | Destination |
| `searchFlights` | Search flights by route, date, cabin class | Flight |
| `bookFlight` | Book a flight (creates booking + payment intent) | Flight |
| `cancelFlightBooking` | Cancel a flight booking | Flight |
| `searchHotels` | Search hotels by destination, amenities, style, price range | Hotel |
| `createHotelBooking` | Create a pending hotel booking (for pricing) | Hotel |
| `confirmHotelBooking` | Confirm booking after payment | Hotel |
| `cancelHotelBooking` | Cancel a hotel booking | Hotel |
| `createItinerary` | Create an itinerary for a trip | Itinerary |
| `addItineraryDay` | Add a day to an itinerary | Itinerary |
| `addItineraryActivity` | Add an activity to a day | Itinerary |
| `updateItineraryActivity` | Update an existing activity | Itinerary |
| `deleteItineraryActivity` | Remove an activity | Itinerary |
| `getTripDetails` | Get full trip data with all bookings | Supervisor |
| `updateTrip` | Update trip dates, title, destination | Supervisor |
| `getUserPreferences` | Get user travel preferences | Supervisor |
| `createPaymentIntent` | Create a Stripe payment intent | Flight, Hotel |

### Resources

Resources are read-only data the host application can attach as context:

| Resource URI | Description |
|-------------|-------------|
| `triploom://trips/{tripId}` | Full trip data (bookings, itinerary, destination, status) |
| `triploom://users/{userId}/preferences` | User travel preferences, interests, budget, dietary needs |
| `triploom://destinations/{destinationId}` | Destination details (highlights, weather, timezone, images) |
| `triploom://trips/{tripId}/itinerary` | Trip itinerary with all days and activities |
| `triploom://users/{userId}/trips` | List of all user trips (for past trip lookups) |

### Prompts

Prompts are user-triggered templates, surfaced as actions in the chat UI:

| Prompt | Args | Description |
|--------|------|-------------|
| `/plan-trip` | `destination?`, `startDate?`, `endDate?` | Start planning a new trip from scratch. Embeds user preferences as context. |
| `/review-itinerary` | `tripId` | Load and review an existing itinerary for conflicts, gaps, or optimization opportunities. |
| `/budget-summary` | `tripId` | Generate a full budget breakdown of a trip (flights + hotel + estimated activity costs). |
| `/compare-flights` | `origin`, `destination`, `date` | Compare available flights with structured analysis. |
| `/packing-list` | `tripId` | Generate a packing list based on destination, dates, and planned activities. |

### Elicitation

Elicitation allows the MCP server to request structured input from the user mid-execution:

- **Missing travel details:** If a user says "book me a flight to Paris" without dates, the server elicits a form with date pickers and cabin class selection
- **Booking confirmation:** Present a structured form with booking details for review before finalizing
- **Payment flow (URL mode):** Redirect to a secure Stripe checkout page for payment, keeping card details out of the LLM context

### Sampling

Sampling lets the MCP server request LLM completions from the client. Potential use cases:

- **Itinerary optimization:** After collecting all trip data server-side, use sampling to ask the LLM to optimize the schedule for minimal travel time and balanced activities
- **Natural language to search params:** Convert vague requests ("somewhere warm in March, under $2000") into structured API query parameters

*Note: Since our agents already have LLM access via LangGraph, sampling is a secondary feature. We'll evaluate during implementation whether it adds value beyond what the agents already do.*

## TODOs

### AI & MCP (Current Priority)
- [ ] Implement MCP Server with all tools, resources, and prompts
- [ ] Implement LangGraph supervisor agent + sub-agents
- [ ] Connect agents to MCP server via `langchain-mcp-adapters`
- [ ] Add SSE streaming endpoint to API
- [ ] Integrate `useStream` in frontend chat UI
- [ ] Implement human-in-the-loop flows (booking confirmations, payments)
- [ ] Add conversation persistence (PostgresSaver + thread ID on trips + messages jsonb)
- [ ] Implement tool-call UI widgets (destination carousel, hotel cards, flight comparison, seat picker, payment form)
- [ ] Plan and design how to integrate other agent systems into UI. eg: buttons or `/commands` for MCP server prompts
- [ ] Add elicitation flows for missing information and booking confirmations

### Data Improvements
- [ ] Fix destination photos (some are SVG country flags, e.g., Monaco)
- [ ] Improve destination descriptions via AI (more about culture, less demographics, longer)
- [ ] Add more destinations worldwide (Maldives, Arraial do Cabo, Trancoso, etc.)
- [ ] Add more hotels per destination from additional sources
- [ ] Remove data acquisition/generator scripts when data collection is complete

### Testing & Quality
- [ ] Agent evaluation tests (evaluate tool selection, response quality, flow correctness)
- [ ] E2E tests for frontend (Playwright)
- [ ] Choose evaluation library and strategy (Evalite, LangSmith evals, or bun:test-based)

### Observability
- [ ] Add OpenTelemetry tracing to LLM calls (LangChain/LangGraph spans)
- [ ] Add OpenTelemetry tracing to MCP server tool executions
- [ ] Add wide event logging to agents and MCP server (matching existing API patterns)

### Future Enhancements
- [ ] Plan out UI/UX changes for each trip status:
  - [ ] Weather display for current trips in chat and more useful information for a current trip.
  - [ ] For a completed trip, block chat and show a widget talking about how trip was over, "how was your trip?" feedback card for emailing us + CTA to start planning a new trip...
- [ ] Option for automatic AI payments vs manual card entry each time
- [ ] Airport confirmation card: "Based on your preferences, are you flying out of JFK?" with "Yes", "No", and "Yes, always" buttons (last one bypasses the confirmation for future bookings)
- [ ] Multi-option suggestion carousels: Instead of a single AI-picked suggestion, present 3 options with a highlighted "top pick" for both hotel and flight booking flows

## Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL (via Docker Compose)

### Running Locally

```bash
# Start database
pnpm db:up

# Run migrations and seed
pnpm db:migrate
pnpm db:seed

# Start API
pnpm dev:api

# Start frontend
pnpm dev:web
```

### Testing

- Run API tests: `pnpm test:api`
- Tests use an isolated `*_test` database (auto-created from `DATABASE_URL`)
- Shared test harness: `packages/api/src/__tests__/harness` (`createTestContext`, `createTestApp`, `createJsonRequester`, `createHeaderAuthMock`)
