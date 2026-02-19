"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { tripQueries } from "@/lib/api/react-query/trips";
import { CurrentTripCard } from "@/components/current-trip-card";

/**
 * TODO: Implement functionality
 */
export function HomeChatInput() {
  const { data: currentTrips = [] } = useInfiniteQuery(
    tripQueries.listTrips({
      status: ["current"],
      limit: 1,
    }),
  );

  const currentTrip = currentTrips[0];

  const handleSubmit = () => {
    // Would redirect to /chat with the message
    // For now, just a visual mockup
  };

  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <h3 className="mb-2 text-lg font-semibold">
        {currentTrip ? "Message your trip assistant" : "Ask your travel agent"}
      </h3>

      {currentTrip ? <CurrentTripCard trip={currentTrip} /> : null}

      {/*
        TODO: Already suggestions above it in the greeting.tsx cards, but could add suggestions here too.
        */}
      <PromptInput
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md hover:border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
      >
        <PromptInputTextarea
          placeholder={
            currentTrip
              ? "Ask AI to update this trip: tweak flights, change hotel, or adjust the itinerary..."
              : "Where would you like to go? Ask me anything about travel..."
          }
          className="min-h-12 resize-none border-0 bg-transparent focus-visible:ring-0 max-h-32"
        />
        <PromptInputFooter className="justify-end p-2 pt-0">
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {currentTrip
          ? "Press Enter to continue your current trip conversation with AI"
          : "Press Enter to start a conversation with your travel agent"}
      </p>
    </section>
  );
}
