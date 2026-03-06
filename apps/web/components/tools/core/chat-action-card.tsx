"use client";

import type { ReactNode } from "react";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Button } from "@/components/ui/button";

type ChatActionCardProps = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  imageSrc?: string;
  imageAlt?: string;
  disabled?: boolean;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  children?: ReactNode;
};

export function ChatActionCard({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  imageSrc,
  imageAlt = "",
  disabled,
  confirmDisabled,
  cancelDisabled,
  children,
}: ChatActionCardProps) {
  return (
    <ToolCallCard className="border-transparent shadow-none">
      <ToolCallCard.Header>
        {imageSrc ? <ToolCallCard.Image src={imageSrc} alt={imageAlt} /> : null}

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>{title}</ToolCallCard.Title>

          <ToolCallCard.Description className="first-letter:normal">
            {description}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      {children ? (
        <ToolCallCard.Content className="space-y-4">
          {children}
        </ToolCallCard.Content>
      ) : null}

      <ToolCallCard.Footer>
        <Button
          disabled={disabled || confirmDisabled}
          onClick={onConfirm}
          size="sm"
        >
          {confirmLabel}
        </Button>

        <Button
          disabled={disabled || cancelDisabled}
          onClick={onCancel}
          size="sm"
          variant="outline"
        >
          {cancelLabel}
        </Button>
      </ToolCallCard.Footer>
    </ToolCallCard>
  );
}
