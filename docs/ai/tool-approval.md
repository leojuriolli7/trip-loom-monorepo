# Tool Approval Pattern

Destructive or significant MCP tools are wrapped so the user sees the proposed action and approves or rejects before execution. This keeps the agent flow simple (one tool call, not two) while giving the user full control.

## How It Works

```
Agent calls create_itinerary(args)
         |
         v
  withApproval wrapper
         |
         v
  interrupt({ type: "tool-approval", toolName, args })
         |
         v
  Graph pauses — frontend renders approval card
         |
    +----+----+
    |         |
 Approve    Reject (optional feedback)
    |         |
    v         v
 Original   Agent receives feedback string,
 MCP tool   adjusts approach and retries
 executes
```

The wrapper preserves the original tool's name, description, and schema. The agent doesn't know it's wrapped — it calls tools the same way it always does. Type safety is automatic: the `APPROVAL_REQUIRED_TOOL_NAMES` array uses `satisfies readonly TripLoomMcpToolName[]`, so adding an invalid tool name is a compile error.

## Implementation

### `withApproval(mcpTool)` — `packages/agents/src/tools/core/with-approval.ts`

Factory that wraps any `DynamicStructuredTool` with an interrupt-based approval step:

```ts
export function withApproval(mcpTool: DynamicStructuredTool): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: mcpTool.name,
    description: mcpTool.description,
    schema: mcpTool.schema,
    func: async (input) => {
      const event: ToolApprovalInterrupt = {
        type: "tool-approval",
        toolName: mcpTool.name,
        args: input,
      };

      const decision = toolApprovalResumeSchema.parse(interrupt(event));

      if (decision.approved) {
        return mcpTool.invoke(input);
      }

      return decision.message
        ? `User rejected this action. Feedback: "${decision.message}".`
        : "User rejected this action. Ask the user what they'd like instead.";
    },
  });
}
```

Zero type assertions. Uses the `DynamicStructuredTool` constructor directly so the schema passes through natively.

### Tool registry — `packages/agents/src/tools/core/registry.ts`

Single array controls which tools require approval:

```ts
const APPROVAL_REQUIRED_TOOL_NAMES = [
  "create_itinerary",
  "add_itinerary_day",
  "add_itinerary_activity",
  "update_itinerary_activity",
  "delete_itinerary_activity",
  "cancel_hotel_booking",
  "cancel_flight_booking",
] as const satisfies readonly TripLoomMcpToolName[];

export const APPROVAL_REQUIRED_TOOLS: ReadonlySet<string> = new Set(
  APPROVAL_REQUIRED_TOOL_NAMES,
);
```

### Graph wiring — `packages/agents/src/graph.ts`

After loading MCP tools, approval-required ones are wrapped automatically:

```ts
const allTools = rawTools.map((t) =>
  APPROVAL_REQUIRED_TOOLS.has(t.name) ? withApproval(t) : t,
);
```

## Adding Approval to a New Tool

**One step:** add the MCP tool name to `APPROVAL_REQUIRED_TOOL_NAMES` in `registry.ts`.

That's it. The `satisfies` clause ensures the name is a valid `TripLoomMcpToolName` at compile time. The graph automatically wraps it, and the frontend already routes `tool-approval` interrupts to the appropriate card.

If the new tool needs a custom approval card (not itinerary or cancellation), add a case to `ToolApprovalInterruptCard` in `chat-conversation.tsx`.

## Interrupt and Resume Types

```ts
// Interrupt payload — sent to frontend
type ToolApprovalInterrupt = {
  type: "tool-approval";
  toolName: string;
  args: Record<string, unknown>;
};

// Resume payload — sent back from frontend
type ToolApprovalResume =
  | { approved: true }
  | { approved: false; message?: string };
```

Both types are exported from `@trip-loom/agents`.

## Frontend Rendering

Approval interrupts are rendered in the **Live Interrupts** layer (Layer C) of the chat UI.

The `ToolApprovalInterruptCard` component in `chat-conversation.tsx` routes by tool name:

| Tool Names | Card Component | Behavior |
|------------|---------------|----------|
| `cancel_hotel_booking`, `cancel_flight_booking` | `CancellationApprovalCard` | Fetches booking details, shows summary, Confirm/Keep buttons |
| All itinerary mutations | `ItineraryApprovalCard` | Shows proposed changes as badges, "Preview itinerary" button for `create_itinerary`, Approve/Reject with optional feedback |

### ItineraryApprovalCard details

- **`create_itinerary`**: displays day/activity count badges + "Preview itinerary" button that opens the full itinerary sheet
- **`add_itinerary_day`**: shows day number, date, and title as badges
- **`add_itinerary_activity` / `update_itinerary_activity`**: shows title, location, and start time as badges
- **`delete_itinerary_activity`**: generic approval prompt
- **Reject flow**: toggling "Reject" reveals a textarea for feedback; "Send feedback" resumes with `{ approved: false, message }`

### Post-approval rendering

After the user approves and the tool executes, the result appears as an `ItineraryMutationToolCard` (Layer A) with tool-specific labels:

| Tool | Loading Text | Completed Title |
|------|-------------|-----------------|
| `create_itinerary` | "Creating your itinerary..." | "Created your itinerary" |
| `add_itinerary_day` | "Adding a day..." | "Added a new day" |
| `add_itinerary_activity` | "Adding an activity..." | "Added a new activity" |
| `update_itinerary_activity` | "Updating activity..." | "Updated activity" |
| `delete_itinerary_activity` | "Removing activity..." | "Removed activity" |
