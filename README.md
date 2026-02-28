# TripLoom Monorepo

*Your AI Travel Agent — plan & book everything in one place*

*AI weaving everything together*

### Introduction

**Goal**: Creating an entire senior-level application with modern technologies and great UI/UX.

**Elevator pitch**: Come in, find a destination based on what you like, book tickets and hotels, and create an itinerary for your next vacation without leaving an AI chatbox.

### **Core tech features**

- MCP Server
- Fully type-safe API client + API definition: Need a library like tRPC that can generate a typesafe client for usage, but that can be used on the frontend & on the MCP server to call the API easily, plus types/schemas for each endpoint for eventual tool calls and validation. -- Elysia with Eden client: `packages/api`
- Multiple AI agents, orchestrated with LangChain
- Shadcn, warm design with big spacing and cozy feel
- Database with Drizzle, for additional typesafety

### **Example capabilities**

- Book a flight and return flight (Or just flight/just return flight)
- Book accomodations (hotel, resort, Airbnb…)
- Create an itinerary (Either after the bookings are finished, or on-demand for anywhere you ask for) —> Online research
- Research destinations and suggest them for you (Looking at your past trips and asking you questions) —> Online research
- All payments done with a real Stripe account
    - We receive payments, idea is that we would then pass the payments to the hotel/airline, and receive a percentage…

**Important**: Agents will have “pre-written” paths sometimes, but are able to skip one or another step. For instance: The user can ask for research for destinations, then pick a destination to book flights, but choose not to book a hotel with us, so we can skip to the itinerary, and vice-versa…

Idea is to be composable, not limited to the one core flow of going from suggestion to booking everything and to itinerary. More below:

### **On composability**

- Can ask AI to look up past trips and it will call a “getPastTrips” tool and render a widget for you to explore
    - Past trips also need to be a MCP resource
- Can ask AI to edit an itinerary as well (Would render a widget with itineraries for you to choose, unless it's confident it knows the itinerary you asked for, in which case it would just move to asking you what to change — if you already said it, it would skip to proposing itinerary changes, with a UI widget again, something like a diff viewer for markdown rendering the differences in each itinerary)
- **NOT on initial scope: Cancellations (Later!)**

**Tools details:** 

- Asking for confirmation (approval, ellicitation...) before any payments
    - ellicitation/approval could be like said above, render (for example) destination suggestions on a carousel for user to pick/suggest changes (goes through research again for new alternatives based on user feedback).
- On booking of a flight, render the airplane seats widget to confirm or select different seat, with pricing for each
- Most tools would have its own UI widget
    - Agent suggesting hotels to book: Render carousel with 3 hotel cards with details + button to select one
    - Agent suggesting destinations: Carousel with destination cards

### **Database**

Considerations for the composability I mentioned above:

- User can have multiple trips
- Trips are required to have a destination, start and end date. Optionally: can have flights, can have an accomodation reservation, can have an itinerary
- Reservations
- Accomodations have a destination
- Many destinations (cities within a coutry)

### **Challenges**

- Deployment: Does the MCP server live in the same machine as the API?
- Deciding on backend client

After initial implementation, or during building (TDD): 

- Tests for all features (End-to-end for frontend, unit tests for tools, evaluating agents…)

### Development flow

- Planning: Initial high-level planning for AI chat flows, probable tools we will need, user information we will require to function…
    - We won't require user passport, we just book the tickets
    - MCP server resource example: Past user trips, past user reservations
- Start with the frontend: Create the chatbox UI, create example conversations to show off what the widgets will look like (Different conversation paths to exemplify composability)
- Move on to backend API: Authentication, CRUD (List destinations, list user trips…) and typesafe reusable generated API client
- Integrate basic API to frontend: Update user profile, login, sign up…
- MCP server: Create and expose the tools and prompts
- AI Agents: Study and orchestrate the different agents + connect to MCP server, apply persistence to chats (Could store conversations in db)
    - Integrate AI on frontend

## Overview: Before development

### 1. Database Schema

Organize basic schema

### 2. API and API Client

Choose the backend API tech stack

### 3. AI agent orchestration

Create a basic AI agent graph orchestrated with pseudo-code/diagrams.

### 4. MCP Overview

Plan out MCP prompts, resources, tools, ellicitation and sampling usage if necessary.

Server to base myself: https://github.com/modelcontextprotocol/servers/blob/main/src/everything

**4.1 Server**

**4.2 Client**

Client examples: https://modelcontextprotocol.io/clients

### 5. Immediate TODOs

- Need to draft a full spec of which agents will exist, their tools, flows..
- Implement MCP Server: Could be an entire Agent mapping of our API, giving it each endpoint as tools, or via code-mode: 
  - https://blog.cloudflare.com/code-mode-mcp/
  - https://blog.cloudflare.com/code-mode/
- Implement AI agents
- Implement AI frontend experience
  - UI: Should also think about how trips will look in chat, like if a trip is current, we display the weather in location... If trip is current, hide previous planning messages behind a toggle/dropdown.
  - Option for payment: AI can pay automatically for you, or user will input his credit card data manually each time.
- Add evals and tests for agent behavior

Data improvements:
- Some photos, like Monaco, are SVG flags of the countries
- Improve destination descriptions via AI: More about culture, less about demographics, longer...
- Add more destinations, eg Maldivas, Arraial do Cabo, Trancoso... + worldwide
- Add more hotels for each destination using other sources
- Remove data acquisition/generators scripts when done with data collection

## Testing Notes

- Run API tests from monorepo root with `pnpm test:api`.
- API tests use an isolated database, not your main dev database.
- The test runner creates and recreates `<DATABASE_URL db name>_test` before running migrations + Vitest.
- Tests fail fast if `DATABASE_URL` does not point to a `*_test` database.
- Shared API test harness lives in `packages/api/src/__tests__/harness` (`createTestContext`, `createTestApp`, `createJsonRequester`, `createHeaderAuthMock`).
