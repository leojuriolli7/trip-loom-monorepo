# @trip-loom/agents

LangGraph.js multi-agent system for TripLoom. A supervisor agent orchestrates 4 specialized sub-agents (Destination, Flight, Hotel, Itinerary) that interact with the world exclusively through MCP tools.

## Architecture

```
User (browser)
  │
  ▼
packages/api ─── POST /api/chat (SSE) ──► packages/agents
  │                                           │
  │ creates OAuth token                       │ LangGraph supervisor
  │ pipes SSE stream                          │ + 4 sub-agents
  │                                           │
  │                                           ▼
  │                                    @langchain/mcp-adapters
  │                                           │
  │                                           ▼
  │                                    apps/mcp-server (19 tools, 5 resources)
  │                                           │
  └───────────────────────────────────────────┘
                    API calls via Eden client
```

### Key boundaries

- **This package has zero imports from `packages/api`.** No DB access, no internal services, no auth logic. It receives an access token string and an MCP URL — nothing more.
- **All data access goes through MCP tools.** The agents call the MCP server, which calls the API on behalf of the authenticated user.
- **The API is the orchestrator.** It handles auth, creates OAuth tokens for agent→MCP auth, assembles the graph, and pipes the LangGraph stream to SSE.

### Persistence

- **Checkpointer (`PostgresSaver`):** Stores full conversation state per thread (messages, tool calls, graph state). Tables created automatically via `setup()`.
- **Store (`PostgresStore`):** Cross-session memory for user preferences and behavioral signals, namespaced by userId.
- **Trip ↔ Thread link:** The `trip` table has a `threadId` column (nullable). Assigned on first chat message. Messages are read from the checkpointer — no duplication.

### Agent→MCP auth

The API creates user-scoped OAuth access tokens by inserting into Better Auth's `oauth_access_token` table (same table the MCP plugin uses for browser-issued tokens). The MCP server validates these via `auth.api.getMcpSession()` — identical to the Claude Desktop flow.

### LLM models

Configurable per agent via environment variables (e.g. `SUPERVISOR_MODEL`, `DESTINATION_AGENT_MODEL`). Defaults to `gpt-5.2`.

## Tooling workflow

### Add a new tool (example: `suggest-meal`)

Current steps:

1. Add the tool file (example: `packages/agents/src/tools/suggest-meal.ts`).
2. Register it in `packages/agents/src/tools/core/registry.ts` (import + assign to the local tools list for the target agent).
3. Update that agent prompt so it actually calls the tool when appropriate.

So the required wiring is 2 files plus 1 prompt update for behavior.

### If the tool needs a custom streaming event

Custom-event surface is intentionally removed right now. Re-enabling it requires:

1. Tool emits a custom event payload.
2. `TripLoomStreamBag.CustomEventType` update.
3. Add `onCustomEvent` handling in web stream/context.
4. Add a UI renderer for that event.
5. Re-add `"custom"` stream mode in API.

## TODOS

### Polish
- [ ] Better organize chat page components (Remove `_components` pattern)
- [ ] Improve agent behavior: 
  - [ ] Supervisor parrotting the specialist answer
  - [ ] Read MCP resources and tools more, eg: Check user past trips for context before proceeding
  - [ ] Improve prompts for real-world usage
  - [ ] Refine system prompts based on testing
  
### Cross-Session Memory

- [ ] Wire PostgresStore: read/write user preferences namespaced by userId

### Agent Evaluation

- [ ] Choose eval framework (Evalite, LangSmith, or Vitest-based)
- [ ] Test scenarios per agent domain
- [ ] Evaluate routing accuracy, tool call correctness, response quality
- [ ] Add OTEL and concrete logging to all agent messages + MCP server

### Frontend Finish Line

Build the actual frontend UI for all tool calls and build the general frontend experience

- [ ] Add UI for each tool the agent calls + secondary tools like webSearch, get user preferences...
- [ ] Add more E2E testing
- [ ] Improve UI for each trip stage: upcoming trips vs draft trips vs current trips with different widgets visible (like weather widget -- or get_weather tool?)
- [ ] Add suggestion prompts above chat input prompt (follow-up suggestions for current conversation)
- [ ] Add integration with MCP prompts and more in each component: Destination details dialog, greetings page suggestion cards, etc...
- [ ] Finalize README's and ensure up-to-date documentation for general reading + deployments
- [ ] Github workflow for each PR: Run tests


## Dependencies

| Package | Purpose |
|---------|---------|
| `@langchain/langgraph` | Graph orchestration, supervisor, react agents |
| `@langchain/core` | Base abstractions (messages, tools, runnables) |
| `@langchain/openai` | OpenAI LLM provider |
| `@langchain/mcp-adapters` | Connect agents to MCP server tools |
| `@langchain/langgraph-checkpoint-postgres` | PostgresSaver (checkpointer) + PostgresStore (memory) |


## Environment Variables

This package requires the following environment variables (provided by the app that imports it):


| Variable | Required | Description |
|----------|----------|-------------|
| `SUPERVISOR_MODEL` | No (defaults to GPT 5.2) | OpenAI LLM Model for Supervisor Agent |
| `FLIGHT_AGENT_MODEL` | No (defaults to GPT 5.2) | OpenAI LLM Model for Flight Booking Agent |
| `ITINERARY_AGENT_MODEL` | No (defaults to GPT 5.2) | OpenAI LLM Model for Itinerary Agent |
| `HOTEL_AGENT_MODEL` | No (defaults to GPT 5.2) | OpenAI LLM Model for Hotel Booking Agent |
| `OPENAI_API_KEY` | Yes | OpenAI API Key |
