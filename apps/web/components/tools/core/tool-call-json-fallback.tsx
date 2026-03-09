"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { TripLoomToolCall } from "@trip-loom/agents";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

export function ToolCallJsonFallback({
  toolCall,
}: {
  toolCall: TripLoomToolCall;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex justify-between items-center">
          <h3 className="mb-2 text-sm font-medium">Tool: {toolCall.name}</h3>
          <CollapsibleTrigger className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none">
            <ChevronDownIcon
              className={cn(
                "size-3.5 shrink-0 transition-transform duration-200",
                !isOpen && "-rotate-90",
              )}
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
          <pre className="overflow-x-auto text-xs">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
