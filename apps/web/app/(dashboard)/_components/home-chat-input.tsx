"use client";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

export function HomeChatInput() {
  const handleSubmit = () => {
    // Would redirect to /chat with the message
    // For now, just a visual mockup
  };

  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <PromptInput
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md hover:border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
      >
        <PromptInputTextarea
          placeholder="Where would you like to go? Ask me anything about travel..."
          className="min-h-12 resize-none border-0 bg-transparent focus-visible:ring-0 max-h-32"
        />
        <PromptInputFooter className="justify-end p-2 pt-0">
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Press Enter to start a conversation with your travel agent
      </p>
    </section>
  );
}
