"use client";

import { focusPromptBlock } from "@/lib/focus-chat-input";
import { dispatchSetPrompt } from "@/lib/prompt-events";
import { PROMPTS } from "@trip-loom/contracts/prompts";
import { useEffect } from "react";

export function SuggestNewTripUrlHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("from") === "suggest-new-trip-card") {
      const destinationName = params.get("destinationName");

      if (destinationName) {
        const startDate = params.get("startDate");
        const endDate = params.get("endDate");

        const hasDates =
          typeof startDate === "string" && typeof endDate === "string";

        const promptPayload = {
          destinationName,
          ...(hasDates ? { startDate, endDate } : {}),
        };

        dispatchSetPrompt(PROMPTS.plan_trip_to_destination, promptPayload);

        requestAnimationFrame(() => {
          focusPromptBlock();
        });
      }
    }
  }, []);

  return null;
}
