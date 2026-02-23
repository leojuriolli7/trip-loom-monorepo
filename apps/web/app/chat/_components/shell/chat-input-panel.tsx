"use client";

import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { usePathname } from "next/navigation";
import { CHAT_INPUT_ID } from "../chat-input-focus";

export function ChatInputPanel() {
  const pathname = usePathname();
  const isActiveChatRoute = pathname.startsWith("/chat/");

  const handleSubmit = () => {
    // TODO: Wire this input to AI flow and route-based chat creation.
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
            placeholder={
              isActiveChatRoute
                ? "Ask about your trip..."
                : "Where would you like to go?"
            }
            className="min-h-4 max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0"
          />

          <PromptInputSubmit />
        </PromptInput>
      </div>
    </div>
  );
}
