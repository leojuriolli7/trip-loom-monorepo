"use client";

import type { PromptDefinition } from "@trip-loom/contracts/prompts";
import { PROMPTS } from "@trip-loom/contracts/prompts";
import { useCallback } from "react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestions";
import { focusPromptBlock } from "@/lib/focus-chat-input";
import { dispatchSetPrompt } from "@/lib/prompt-events";

const suggestions = [
  {
    label: "Plan an itinerary",
    prompt: PROMPTS.plan_itinerary,
  },
  {
    label: "Book accommodations",
    prompt: PROMPTS.book_accommodations,
  },
  {
    label: "Explore destinations",
    prompt: PROMPTS.explore_destinations,
    prefilledArgs: {},
  },
];

export function EmptyStateSuggestions() {
  const handleSuggestionClick = useCallback(
    (prompt: PromptDefinition, prefilledArgs?: Record<string, string>) => {
      dispatchSetPrompt(prompt, prefilledArgs);

      requestAnimationFrame(() => {
        focusPromptBlock();
      });
    },
    [],
  );

  return (
    <Suggestions className="mx-auto w-max max-w-full">
      {suggestions.map((suggestion) => (
        <Suggestion
          key={`${suggestion.prompt.name}-${suggestion.label}`}
          suggestion={suggestion.label}
          onClick={() =>
            handleSuggestionClick(suggestion.prompt, suggestion.prefilledArgs)
          }
        />
      ))}
    </Suggestions>
  );
}
