"use client";

import type { PromptDefinition } from "@trip-loom/contracts/prompts";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { PROMPT_BLOCK_ID } from "@/lib/focus-chat-input";

type PromptBlockProps = {
  definition: PromptDefinition;
  prefilledArgs: Record<string, string>;
  argValues: Record<string, string>;
  onArgChange: (name: string, value: string) => void;
  onClear: () => void;
};

export function PromptBlock({
  definition,
  prefilledArgs,
  argValues,
  onArgChange,
  onClear,
}: PromptBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClear();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const form = event.currentTarget.closest("form");
        const submitButton = form?.querySelector('button[type="submit"]');
        if (
          submitButton instanceof HTMLButtonElement &&
          submitButton.disabled
        ) {
          return;
        }
        form?.requestSubmit();
        return;
      }

      if (event.key === "Backspace" && event.currentTarget.value === "") {
        const inputs = containerRef.current?.querySelectorAll(
          "input:not([readonly])",
        );
        if (!inputs?.length) return;

        const firstInput = inputs[0];
        if (event.currentTarget === firstInput) {
          event.preventDefault();
          onClear();
        }
      }
    },
    [onClear],
  );

  return (
    <div
      id={PROMPT_BLOCK_ID}
      ref={containerRef}
      data-slot="prompt-block"
      className="relative min-h-16 flex-1 px-3 py-3 md:text-sm text-base leading-relaxed"
    >
      <Button
        onClick={onClear}
        variant="ghost"
        size="sm"
        className="absolute top-1.5 right-1.5"
        aria-label="Clear prompt"
      >
        <XIcon />
      </Button>

      <div className="pr-6 leading-relaxed">
        {definition.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <span key={index} className="text-foreground">
                {part.text}
              </span>
            );
          }

          const prefilledValue = prefilledArgs[part.name];

          if (part.required && prefilledValue) {
            return (
              <span key={index} className="font-medium text-primary">
                {prefilledValue}
              </span>
            );
          }

          const value = argValues[part.name] ?? "";

          return (
            <span key={index} className="inline">
              {part.prefix ? (
                <span className="text-foreground">{part.prefix}</span>
              ) : null}
              <input
                type="text"
                value={value}
                onChange={(e) => onArgChange(part.name, e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={part.description}
                className={cn(
                  "inline-block border-b border-dashed border-primary/40 bg-transparent md:text-sm text-base text-foreground outline-none transition-colors",
                  "placeholder:text-muted-foreground/50",
                  "focus:border-primary focus:border-solid",
                  "w-auto min-w-24 mx-1",
                )}
                size={Math.max((value || part.description || "").length, 12)}
                aria-label={part.description}
              />
              {part.suffix ? (
                <span className="text-foreground">{part.suffix}</span>
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
