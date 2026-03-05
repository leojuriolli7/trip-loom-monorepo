"use client";

import Image from "next/image";
import { ToolCallCard } from "@/components/tools/tool-call-card";

export function UserPreferencesToolCard() {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <div className="relative size-12 shrink-0 rounded-2xl border border-border/60 bg-background/75 p-2">
          <Image
            src="/duffel.png"
            alt=""
            fill
            sizes="48px"
            className="object-contain"
          />
        </div>

        <div className="space-y-1">
          <ToolCallCard.Title>Read your travel preferences</ToolCallCard.Title>
          <ToolCallCard.Description>
            Checked your saved profile so new suggestions match your style,
            budget, and comfort needs
          </ToolCallCard.Description>
        </div>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
