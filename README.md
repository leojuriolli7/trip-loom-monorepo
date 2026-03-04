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

The AI system follows a **supervisor multi-agent pattern** built with LangGraph.js. A central supervisor agent receives all user messages and delegates to specialized sub-agents based on the user's intent.

Tools are split across **three layers**, each with a distinct responsibility:

```
User <-> Chat UI <-> API (SSE endpoint) <-> LangGraph Supervisor
                                                    |
                                          +---------+---------+
                                          |         |         |
                                     Destination  Flight    Hotel    Itinerary
                                      Agent      Agent     Agent     Agent
                                       |  \        |  \      |  \      |  \
                                       |   \       |   \     |   \     |   \
                                 MCP Tools  Agent  MCP  Agent MCP Agent MCP Agent
                                            Tools       Tools     Tools     Tools
                                       |          |         |         |
                                       +----------+---------+---------+
                                                   |
                                             MCP Server
                                                   |
                                          Eden Client -> API
```

#### Three-Layer Tool Architecture

| Layer | Lives In | Purpose | Examples |
|-------|----------|---------|----------|
| **MCP Tools** | MCP Server (`apps/mcp-server`) | Generic API wrapper — data fetching and mutations. Reusable by any MCP client (Claude Desktop, agents, future apps). | `search_destinations`, `book_flight`, `create_hotel_booking` |
| **Agent Tools** | LangGraph agents (`apps/agents`) | UI-aware, app-specific tools that emit structured data for the frontend to render as widgets. Encode UX decisions (what to show, when to ask for confirmation). | `suggest_destinations`, `suggest_flight`, `request_payment`, `request_confirmation` |
| **Frontend Actions** | Next.js frontend (`apps/web`) | Deterministic, user-triggered actions. No AI involvement — buttons and forms that call the API directly. | "Pay" button creates payment intent, "Confirm"/"Deny" buttons resume the LangGraph graph |

**Why this split:**
- **MCP server stays generic.** Other clients can use it without our UI. It's a clean API wrapper.
- **Agent tools encode UX decisions.** "Pick one hotel and present it as a card" is a UX choice, not an API operation. These tools use LangGraph's `dispatchCustomEvent` to stream structured data to the frontend via the `custom` stream mode.
- **Payments and confirmations stay deterministic.** The frontend owns payment creation (Stripe intent) and booking state transitions, triggered by explicit user action (button clicks) or by an agent tool that opens the same UI flow.

### Agents

#### Supervisor Agent (Router)
- Receives all user messages and determines which specialized agent should handle the request
- Handles general conversation (greetings, clarifications, trip status questions)
- Maintains the overall conversation flow and decides when to hand off or take back control
- Can access trip and user preference resources for context
- Suggests next steps after a sub-agent completes (e.g., "Now that your hotel is booked, want to plan your itinerary?") but follows the user's lead
- **MCP Tools:** `get_trip_details`, `get_user_preferences`, `update_trip`, `create_trip`

#### Destination Search Agent
- **Purpose:** Help users find and choose a travel destination
- **MCP Tools:** `search_destinations`, `get_destination_details`, `get_recommended_destinations`
- **Agent Tools:** `suggest_destinations` (renders destination card)
- **Web Search:** Enrich destination data with current travel info, visa requirements, weather, events
- **Context:** Reads user preferences (travel interests, preferred regions, budget) to personalize suggestions

#### Flight Booking Agent
- **Purpose:** Search and book inbound/outbound flights for a trip
- **MCP Tools:** `search_flights`, `book_flight`, `cancel_flight_booking`
- **Agent Tools:** `suggest_flight` (renders flight card + seat picker), `request_payment`, `request_confirmation`
- **Context:** Uses trip dates (start date = outbound, end date = inbound) and destination to derive search parameters. Reads user's preferred departure airport from preferences and confirms with the user before searching.
- **Human-in-the-loop:** Confirms departure airport, presents flight suggestion with seat picker, then payment confirmation. User can request different options via chat.

#### Hotel Booking Agent
- **Purpose:** Search and book hotel accommodations
- **MCP Tools:** `search_hotels`, `create_hotel_booking`, `cancel_hotel_booking`
- **Agent Tools:** `suggest_hotel_booking` (renders hotel card with pricing), `request_payment`, `request_confirmation`
- **Web Search:** Enrich hotel data with recent reviews, photos, neighborhood info
- **Context:** Uses trip dates for check-in/check-out, destination for location filtering, user budget/style preferences
- **Flow:** Agent searches hotels, picks the best match based on user preferences, selects a room type (e.g., "standard" for budget travelers), and creates a pending booking via MCP. Then calls `suggest_hotel_booking` to render the booking card. User can approve and pay, or request changes via chat. If user declines, the pending booking is cancelled.
- **Human-in-the-loop:** Interrupt before payment — present the suggested booking, then Stripe payment form upon approval

#### Itinerary Planner Agent
- **Purpose:** Create and modify day-by-day trip itineraries
- **MCP Tools:** `create_itinerary`, `add_itinerary_day`, `add_itinerary_activity`, `update_itinerary_activity`, `delete_itinerary_activity`
- **Agent Tools:** `suggest_itinerary` (renders itinerary draft for approval before saving)
- **Web Search:** Research activities, restaurants, local attractions, opening hours, estimated costs
- **Context:** Uses trip dates, destination, and existing bookings (check-in times, flight arrivals) to plan around constraints
- **Flow:** Agent researches and builds a draft itinerary, presents it via `suggest_itinerary` for user approval. Only after approval does the agent call MCP tools to persist it. User can request changes to the draft via chat before saving.

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

Lives in `apps/mcp-server` and uses:

- Elysia on Bun (consistent with the API, native Web Standard Request/Response)
- `@modelcontextprotocol/sdk` v1.27.1 with `WebStandardStreamableHTTPServerTransport`
- OAuth 2.1 via Better Auth's MCP plugin (`better-auth/plugins/mcp`)
- Eden treaty client for type-safe API calls in every tool

```ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

// Each MCP session gets its own client scoped to the authenticated user
export function createApiClient(accessToken: string) {
  return treaty<App>(process.env.API_BASE_URL!, {
    parseDate: false,
    headers: { authorization: `Bearer ${accessToken}` },
  });
}
```

### Authentication

The MCP server requires an authenticated TripLoom user session. The authenticated user's session token is passed through to every Eden client call, so all API-level ownership guards apply — a user can never access or mutate another user's trips, bookings, itineraries, or preferences through the MCP server. The API already enforces this: every user-scoped route checks `trip.userId` (or joins through trip for sub-resources like bookings and payments), and public catalog endpoints (destinations, hotels) correctly skip auth.

### MCP Tools

MCP tools are generic API wrappers that live in the MCP server (`apps/mcp-server`). They handle data fetching and mutations. Any MCP client can use them — our agents, Claude Desktop, future apps.

| Tool | Description | Used By |
|------|-------------|---------|
| `search_destinations` | Search destinations by text, region, country, highlights | Destination Agent |
| `get_destination_details` | Get full destination info + related hotels | Destination Agent |
| `get_recommended_destinations` | Get personalized recommendations based on user preferences | Destination Agent |
| `search_flights` | Search flights by route, date, cabin class | Flight Agent |
| `book_flight` | Create a pending flight booking | Flight Agent |
| `cancel_flight_booking` | Cancel a flight booking | Flight Agent |
| `search_hotels` | Search hotels by destination, amenities, price range, rating | Hotel Agent |
| `create_hotel_booking` | Create a pending hotel booking (returns pricing) | Hotel Agent |
| `cancel_hotel_booking` | Cancel a hotel booking | Hotel Agent |
| `create_itinerary` | Create an itinerary for a trip (with nested days + activities) | Itinerary Agent |
| `add_itinerary_day` | Add a day to an existing itinerary | Itinerary Agent |
| `add_itinerary_activity` | Add an activity to a day | Itinerary Agent |
| `update_itinerary_activity` | Update an existing activity | Itinerary Agent |
| `delete_itinerary_activity` | Remove an activity | Itinerary Agent |
| `get_trip_details` | Get full trip data with all bookings, itinerary, destination | Supervisor |
| `create_trip` | Create a new trip | Supervisor |
| `update_trip` | Update trip dates, title, destination | Supervisor |
| `get_user_preferences` | Get user travel preferences | Supervisor |


### Agent Tools

Agent tools live in the LangGraph agent code (`apps/agents`), NOT in the MCP server. They don't call the API — they emit structured data via `dispatchCustomEvent` that the frontend renders as interactive widgets. These tools encode **UX decisions** specific to our app.

The frontend listens for `custom` events in the SSE stream and renders the appropriate widget based on the event type (e.g., `ui:destination_card`, `ui:flight_suggestion`, `ui:payment_request`).

| Tool | Description | Emits Event | Used By |
|------|-------------|-------------|---------|
| `suggest_destinations` | Present destination options as visual cards. AI picks 1 top destination from search results and returns structured data for rendering. | `ui:destination_card` | Destination Agent |
| `suggest_flight` | Present a flight option with seat picker. AI picks 1 flight and suggests a seat. | `ui:flight_suggestion` | Flight Agent |
| `suggest_hotel_booking` | Present a hotel booking card with pricing details. Rendered after AI creates a pending booking via MCP. | `ui:hotel_booking` | Hotel Agent |
| `suggest_itinerary` | Present a draft itinerary for user approval BEFORE saving to the database. | `ui:itinerary_draft` | Itinerary Agent |
| `request_payment` | Tell the frontend to open the Stripe payment form for a pending booking. Triggered by user approval (button click) OR natural language ("Ok let's pay for the hotel"). | `ui:payment_request` | Flight Agent, Hotel Agent |
| `request_confirmation` | Generic confirmation card. Uses a typed `action` field so the frontend can render contextual UI per action type. | `ui:confirmation` | All Agents |

**`request_confirmation` action types:**

| Action | Context | Rendered As |
|--------|---------|-------------|
| `cancel_hotel` | Hotel name, dates, refund amount | "Cancel [hotel]? You'll be refunded $X." [Confirm] [Keep] |
| `cancel_flight` | Flight number, route, refund amount | "Cancel [flight]? You'll be refunded $X." [Confirm] [Keep] |
| `select_airport` | Airport code, airport name | "Flying out of JFK?" [Yes] [Change] |
| `approve_itinerary` | Itinerary summary | "Save this itinerary?" [Save] [Edit] |
| `start_payment` | Booking type, amount, description | "Pay $X for [booking]?" [Pay] [Cancel] |

This is extensible — new action types can be added without creating new tools.

#### How Agent Tools Work (LangGraph)

Agent tools use LangGraph's `dispatchCustomEvent` to stream structured data to the frontend via the `custom` SSE stream mode:

```ts
import { tool } from "@langchain/core/tools";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";
import { z } from "zod";

const suggestDestinations = tool(
  async (input, config) => {
    dispatchCustomEvent("ui:destination_card", input, config);
    return "Destination suggestion displayed to the user.";
  },
  {
    name: "suggest_destinations",
    description: "Present a destination to the user as a visual card with highlights and photos",
    schema: z.object({
      destination: z.object({
        id: z.string(),
        name: z.string(),
        country: z.string(),
        highlights: z.array(z.string()),
        imageUrl: z.string(),
        description: z.string(),
      }),
    }),
  }
);
```

The return value goes back to the LLM as a tool result. The `dispatchCustomEvent` data goes to the frontend. This separation means the LLM knows "the card was shown" while the frontend gets the structured data it needs to render.

### Frontend Actions (Deterministic)

These are NOT tools — they're user-triggered actions handled entirely by the frontend, with no AI involvement:

| Action | Trigger | What Happens |
|--------|---------|--------------|
| Create payment intent | User clicks "Pay" button or agent calls `request_payment` | Frontend calls `POST /api/trips/:id/payments/intent` with deterministic payload derived from booking data. Stripe form opens. |
| Confirm/deny action | User clicks confirm/deny on a `request_confirmation` card | Frontend resumes the LangGraph graph via `Command(resume="confirmed"/"denied")` |
| Select destination | User clicks "Select" on a destination card | Frontend sends a message to the agent (or resumes graph) |
| Adjust seat | User picks a different seat on the seat picker | Frontend includes the selected seat when creating the flight booking |

**Key principle:** Payment amount, currency, and booking IDs are never chosen by the LLM. The frontend derives them deterministically from the pending booking data. The AI's role is to create the pending booking and present it — the user and frontend handle the money.

### Deterministic vs Model-Controlled Inputs

Not all inputs should be chosen by the LLM. The three-layer split enforces this naturally:

- **Model-controlled (MCP + Agent Tools):** search filters, destination/hotel/flight preference exploration, itinerary content, which option to suggest.
- **Deterministic (Frontend Actions):** payment amount/currency, payment intent creation, booking confirmation state transitions.
- **Flexible (API keeps dates open-ended):** Hotel check-in/check-out and flight dates are passed by the AI from trip dates context, but the API doesn't enforce them matching trip dates. This allows future flexibility (e.g., hotel hopping, multi-city trips).

### UI Flow Examples

These are concrete end-to-end flows showing how MCP tools, agent tools, and frontend actions work together.

#### Destination Discovery

```
User: "Find me a beach destination in Southeast Asia"

1. Agent calls MCP tool: search_destinations(region="Southeast Asia", highlight="beaches")
   → Receives list of matching destinations
2. Agent picks top destination based on user preferences
3. Agent calls Agent tool: suggest_destinations({destination: {id, name, highlights, imageUrl, ...}})
   → Frontend renders destination card with photo, highlights, "Select" button
4. User clicks "Select" (or types "I like Bali")
   → Message sent back to agent
5. Agent calls MCP tool: get_destination_details(destinationId)
6. Agent: "Great, Bali it is! Want me to create a trip?"
```

#### Hotel Booking

```
User: "Find me a hotel"

1. Agent calls MCP tool: search_hotels(destinationId, priceRange from user preferences)
   → Receives hotel options
2. Agent picks best match, calls MCP tool: create_hotel_booking(tripId, hotelId, dates, roomType)
   → API creates PENDING booking, returns booking with pricing
3. Agent calls Agent tool: suggest_hotel_booking({hotel, booking, totalPrice})
   → Frontend renders hotel card with amenities, rating, pricing + "Pay" / "Skip" buttons
4a. User clicks "Pay"
   → Frontend creates payment intent via API (deterministic, no AI)
   → Stripe form opens, user completes payment
   → Webhook confirms → booking status updated to "confirmed"
   → Frontend resumes LangGraph: Command(resume="payment_confirmed")
   → Agent: "Hotel booked! Want to plan your itinerary?"
4b. User types "Show me something cheaper"
   → Resumes with "rejected", agent cancels pending booking and searches again
4c. User types "Ok let's pay for the hotel"
   → Agent calls Agent tool: request_payment(bookingId, "hotel", amount)
   → Same as 4a — frontend opens the Stripe form
```

#### Flight Booking

```
User: "Book my flights"

1. Agent reads trip dates + destination, checks user's preferred departure airport
2. Agent calls Agent tool: request_confirmation(action="select_airport", {code: "JFK", name: "John F. Kennedy"})
   → Frontend renders: "Flying out of JFK?" [Yes] [Change]
3. User confirms → graph resumes
4. Agent calls MCP tool: search_flights(from="JFK", to="DPS", date=tripStartDate, cabinClass=userPreference)
   → Receives flight options
5. Agent picks best flight, calls Agent tool: suggest_flight({flight, suggestedSeat: "14A"})
   → Frontend renders flight card + interactive seat picker (pre-selected at 14A)
6. User adjusts seat to 16C, clicks "Book & Pay"
   → Frontend calls MCP tool: book_flight(..., seatNumber="16C") → creates PENDING booking
   → Frontend creates payment intent via API (deterministic)
   → Stripe form opens, payment completes
   → Agent: "Outbound flight booked! Want to search for your return flight?"
7. Repeat for inbound flight (date=tripEndDate, from="DPS", to="JFK")
```

#### Itinerary Planning

```
User: "Plan my itinerary"

1. Agent reads trip details: dates, destination, existing bookings (flight arrival/departure, hotel check-in/out)
2. Agent uses web search to research activities, restaurants, attractions at destination
3. Agent builds a draft itinerary considering:
   - Flight arrival time on day 1 (don't schedule morning activities)
   - Hotel check-out time on last day
   - Mix of user interests (from preferences)
   - Estimated costs and opening hours
4. Agent calls Agent tool: suggest_itinerary({days: [{date, title, activities: [...]}]})
   → Frontend renders day-by-day itinerary draft with activity cards
5. User: "Looks good but swap day 2 and 3"
   → Agent adjusts the draft, calls suggest_itinerary again
6. User: "Perfect, save it"
   → Agent calls MCP tools: create_itinerary(tripId, {days with activities})
   → Agent: "Itinerary saved! Your trip to Bali is all set."
```

#### Cancellation (with Confirmation)

```
User: "Cancel my hotel booking"

1. Agent calls MCP tool: get_trip_details(tripId) → finds the booking
2. Agent calls Agent tool: request_confirmation(action="cancel_hotel", {
     hotelName: "Marriott Bangkok",
     dates: "Mar 5-10",
     refundAmount: "$450"
   })
   → Frontend renders: "Cancel Marriott Bangkok (Mar 5-10)? You'll be refunded $450." [Confirm] [Keep]
3. User clicks "Confirm"
   → Graph resumes with "confirmed"
4. Agent calls MCP tool: cancel_hotel_booking(tripId, bookingId)
5. Agent: "Done, hotel booking cancelled. Refund will appear in 5-10 business days."
```

### Resources

Resources are read-only contextual data that MCP clients can attach to the conversation. Unlike tools, resources don't perform actions — they provide background context for the LLM. The host application (or the LLM itself, depending on the client) decides when to read them.

Since the MCP session is already scoped to an authenticated user via OAuth, user-scoped resources use `triploom://user/...` instead of `triploom://users/{userId}/...`.

| Resource URI | Type | Description |
|-------------|------|-------------|
| `triploom://user/preferences` | Static | User travel preferences (cabin class, budget, interests, dietary needs, accessibility) |
| `triploom://user/trips` | Static | List of all user trips with status, dates, and destination summary |
| `triploom://trips/{tripId}` | Template | Full trip data including destination, bookings, itinerary, and payments |
| `triploom://trips/{tripId}/itinerary` | Template | Trip itinerary with all days and activities |
| `triploom://destinations/{destinationId}` | Template | Destination details (highlights, timezone, currency, language, top hotels) |

**Template resources** use `ResourceTemplate` with URI parameters. The `trips/{tripId}` resource includes a `list` callback that returns all user trips for discovery/autocomplete. The destination resource has no `list` (catalog is too large) — clients use destination IDs from search results or trip data.

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
- [x] Implement MCP Server + Authentication
- [x] Implement all MCP tools (18 tools, API wrapper layer)
- [x] Implement MCP Resources
- [x] Implement LangGraph supervisor agent + sub-agents
- [x] Implement agent tools: `suggest_destinations`, `suggest_flight`, `suggest_hotel_booking`, `suggest_itinerary`, `request_payment`, `request_confirmation`
- [x] Connect agents to MCP server via `langchain-mcp-adapters`
- [x] Add SSE streaming endpoint to API
- [x] Integrate `useStream` in frontend chat UI with `custom` event handling for agent tool widgets
- [x] Implement human-in-the-loop flows via `interrupt()` / `Command(resume=...)` for confirmations and payments
- [x] Add conversation persistence (PostgresSaver + thread ID on trips + messages jsonb)
- [ ] Agent polishing: Read [agents/README.md](./packages/agents/README.md)
- [ ] Implement tool-call UI widgets: destination card, hotel booking card, flight card + seat picker, itinerary draft view, confirmation card, Stripe payment form
- [ ] Implement MCP prompts
- [ ] Add elicitation flows for missing information

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
- [ ] Airport confirmation: add "Yes, always" option to `select_airport` confirmation that bypasses the confirmation for future bookings (persisted in user preferences)
- [ ] Multi-option suggestion carousels: expand agent tools from 1 top pick to 3 options with a highlighted recommendation for hotel and flight flows

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
