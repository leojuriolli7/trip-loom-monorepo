"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { CHAT_INPUT_ID } from "@/lib/focus-chat-input";
import { apiClient } from "@/lib/api/api-client";
import { tripQueries } from "@/lib/api/react-query/trips";

export function NewChatInputPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({ text }: PromptInputMessage) => {
    const message = text.trim();
    if (!message || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.api.trips.post({});
      if (result.error || !result.data?.id) {
        throw new Error("Could not create trip");
      }

      const createdTripId = result.data.id;
      void queryClient.invalidateQueries({ queryKey: tripQueries.base() });

      const params = new URLSearchParams({ message });
      router.push(`/chat/${createdTripId}?${params.toString()}`, {
        scroll: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-border/60 bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <PromptInput
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
        >
          <PromptInputTextarea
            id={CHAT_INPUT_ID}
            placeholder="Where would you like to go?"
            className="min-h-4 max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0"
          />

          <PromptInputSubmit status={isSubmitting ? "submitted" : "idle"} />
        </PromptInput>
      </div>
    </div>
  );
}
