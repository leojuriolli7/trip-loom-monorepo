# TripLoom Web App

Next.js frontend for TripLoom chat, trip management, and booking UX.

## Responsibilities

- Authentication and session-based app shell
- Chat interface backed by LangGraph streaming
- Rendering tool calls as UI cards/widgets
- Deterministic user actions (confirmations, payment triggers)
- Data fetching/caching with TanStack Query

## Type Contracts

- API shape inference uses `@trip-loom/api` (`type App` with Eden treaty)
- Shared DTO/enums come from `@trip-loom/contracts`
- Agent stream/tool-call types come from `@trip-loom/agents`

## Development

```bash
# from monorepo root
pnpm dev:web
```

## Testing

```bash
# from monorepo root
pnpm --filter web typecheck
pnpm --filter web test:e2e
```
