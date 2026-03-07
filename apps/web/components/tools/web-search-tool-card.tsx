"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { pluralize } from "@/lib/pluralize";
import { ToolCallCard } from "./tool-call-card";

export type WebSearchToolCall = {
  action: { queries?: string[]; query?: string };
  id: string;
};

export function WebSearchToolCallCard({
  toolCall,
}: {
  toolCall: WebSearchToolCall;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { action } = toolCall || {};
  const { queries, query } = action || {};
  const queryList = queries?.length ? queries : query ? [query] : [];

  if (queryList.length === 0) return null;

  const formattedQueryText = `Performed ${pluralize(queryList.length, "online search", "online searches")}`;

  return (
    <ToolCallCard>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <ToolCallCard.Header className="justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <ToolCallCard.Image
              src="/globe.png"
              alt="Magnifying glass on top of the globe"
              className="scale-110"
            />

            <ToolCallCard.HeaderContent className="min-w-0 pt-0.5">
              <ToolCallCard.Title>Web Search</ToolCallCard.Title>
              <ToolCallCard.Description>
                {formattedQueryText}
              </ToolCallCard.Description>
            </ToolCallCard.HeaderContent>
          </div>

          <CollapsibleTrigger className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none">
            <ChevronDownIcon
              className={cn(
                "size-3.5 shrink-0 transition-transform duration-200",
                !isOpen && "-rotate-90",
              )}
            />
          </CollapsibleTrigger>
        </ToolCallCard.Header>

        <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {queryList.map((queryItem, index) => (
              <li
                key={`${toolCall.id}-${queryItem}-${index}`}
                className="leading-4"
              >
                {queryItem}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </ToolCallCard>
  );
}
