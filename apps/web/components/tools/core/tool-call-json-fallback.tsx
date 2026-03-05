import type { TripLoomToolCall } from "@trip-loom/agents";

export function ToolCallJsonFallback({
  toolCall,
}: {
  toolCall: TripLoomToolCall;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <h3 className="mb-2 text-sm font-medium">Tool: {toolCall.name}</h3>
      <pre className="overflow-x-auto text-xs">
        {JSON.stringify(toolCall.args, null, 2)}
      </pre>
    </div>
  );
}
