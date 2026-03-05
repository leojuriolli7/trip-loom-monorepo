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

### Tools typesafety

Agent tools have complete typesafety via `TripLoomToolCall` type.

As for MCP tools, they are dynamic tools and need static schemas/types to be properly typed. For this, we will need to look at:

1. Making a MCP server a package, like `packages/api`, exporting its DTOs.
2. New package `packages/dto` exporting `packages/dto/api` and `packages/dto/mcp` -- This might be useful to stop us importing server code in the client by importing something like a zod schema from the API's `dto` folder.

The first option would introduce circular dependencies like `api -> agents -> mcp -> api`, so better to introduce `packages/dto`.

`@langchain/mcp-adapters` cannot infer per-tool MCP arg types from a remote server at compile time. That part is dynamic. So the only clean way is a static MCP contract in your monorepo, then reuse it everywhere.

Important constraint: MCP result typing in streamed chat tool messages by tool name: not first-class in LangChain message shape, because tool results are separate messages keyed by tool_call_id (not discriminated by tool name).

1. MCP arguments are easily typesafe by narrowing by toolCall.name:

This is the payload the model sends when it calls a tool.
Example for `search_destinations`:

```ts
  type SearchDestinationsArgs = {
    search?: string;
    region?: "africa" | "asia" | ...;
    country?: string;
    highlight?: ...;
    limit?: number;
    cursor?: string;
```

Example stream:

```ts
// Message A (AI)
tool_calls: [
{ id: "call_1", name: "search_destinations", args: { region: "asia" } }
]
}

// Message B (tool result)
{
type: "tool",
tool_call_id: "call_1",
content: "{\"data\":[...],\"hasMore\":false,\"nextCursor\":null}"
}
```

In Message B:

- `content` is just message content (string | content parts), not automatically `SearchDestinationsResult`.

What data is not type-safe, and when

- Not type-safe by tool-name automatically: `ToolMessage.content` during streaming/history replay.
- Not type-safe automatically: result JSON shape (data, hasMore, etc.) unless you add a resolver layer.
- Still type-safe: tool call names and args in `AIMessage.tool_calls`.

When you do have strong types

- MCP input args: yes, end-to-end from your static MCP DTO contract.
- MCP tool registry names: yes.
- Frontend toolCall.args for MCP calls: yes.
- MCP result payload in raw tool messages: not first-class by LangChain message model; needs explicit linking tool_call_id -> prior tool_call.name if you want typed result recovery.

For now we don't have to worry: MCP tool results are often unimportant, we can render all the UI we need with arguments. eg: `updated your trip's name and dates` --> derived from `update_trip` args; `Booked hotel {name} from {date} to {date}` -\_> derived from `create_hotel_booking` args.

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

- [ ] Typesafety for MCP tools (Requires monorepo reestructuring)
- [ ] Read MCP resources and tools more, eg: Check user past trips for context before proceeding
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

- [ ] Organize ToolCallCard components better: introduce a HeaderSideContent or something for the pattern of image + side content in header.
- [ ] Add UI for each tool the agent calls + secondary tools like webSearch, get user preferences...
- [ ] Add more frontend E2E testing
- [ ] Improve UI for each trip stage: upcoming trips vs draft trips vs current trips with different widgets visible (like weather widget -- or get_weather tool?)
- [ ] Add suggestion prompts above chat input prompt (follow-up suggestions for current conversation)
- [ ] Add integration with MCP prompts and more in each component: Destination details dialog, greetings page suggestion cards, etc...
- [ ] Finalize README's and ensure up-to-date documentation for general reading + deployments
- [ ] Github workflow for each PR: Run tests
- [ ] Option to delete trip
- [ ] Option to archive a trip
- [ ] Option to share a trip conversation (read-only, later forkable)
- [ ] Option to book multiple hotels/flights for a trip -- Almost a DB + API only change, since agents dictate frontend interaction with trips

## Dependencies

| Package                                    | Purpose                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| `@langchain/langgraph`                     | Graph orchestration, supervisor, react agents         |
| `@langchain/core`                          | Base abstractions (messages, tools, runnables)        |
| `@langchain/openai`                        | OpenAI LLM provider                                   |
| `@langchain/mcp-adapters`                  | Connect agents to MCP server tools                    |
| `@langchain/langgraph-checkpoint-postgres` | PostgresSaver (checkpointer) + PostgresStore (memory) |

## Environment Variables

This package requires the following environment variables (provided by the app that imports it):

| Variable                | Required                 | Description                               |
| ----------------------- | ------------------------ | ----------------------------------------- |
| `SUPERVISOR_MODEL`      | No (defaults to GPT 5.2) | OpenAI LLM Model for Supervisor Agent     |
| `FLIGHT_AGENT_MODEL`    | No (defaults to GPT 5.2) | OpenAI LLM Model for Flight Booking Agent |
| `ITINERARY_AGENT_MODEL` | No (defaults to GPT 5.2) | OpenAI LLM Model for Itinerary Agent      |
| `HOTEL_AGENT_MODEL`     | No (defaults to GPT 5.2) | OpenAI LLM Model for Hotel Booking Agent  |
| `OPENAI_API_KEY`        | Yes                      | OpenAI API Key                            |
