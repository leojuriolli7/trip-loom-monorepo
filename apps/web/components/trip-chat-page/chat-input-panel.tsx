"use client";

import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { useChatStream } from "@/context/chat";
import { CHAT_INPUT_ID } from "@/lib/focus-chat-input";

export function ChatInputPanel() {
  const { stream, submitMessage } = useChatStream();

  const handleSubmit = async ({ text }: PromptInputMessage) => {
    await submitMessage(text);
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
            placeholder="Ask about your trip..."
            className="min-h-4 max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0"
          />

          <PromptInputSubmit
            onStop={() => {
              void stream.stop();
            }}
            status={stream.isLoading ? "streaming" : "idle"}
          />
        </PromptInput>
      </div>
    </div>
  );
}
