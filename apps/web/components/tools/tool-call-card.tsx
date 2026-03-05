"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ToolCallCardRoot({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-card via-card to-secondary/25 p-4 shadow-[0_10px_18px_-18px_rgba(15,23,42,0.5)]",
        className,
      )}
      {...props}
    />
  );
}

function ToolCallCardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-start gap-3", className)} {...props} />;
}

function ToolCallCardTitle({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-md font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ToolCallCardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-sm leading-[normal] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ToolCallCardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-3", className)} {...props} />;
}

function ToolCallCardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-4 flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function ToolCallCardButton({
  className,
  size = "sm",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("rounded-full px-4", className)}
      size={size}
      {...props}
    />
  );
}

export const ToolCallCard = Object.assign(ToolCallCardRoot, {
  Header: ToolCallCardHeader,
  Title: ToolCallCardTitle,
  Description: ToolCallCardDescription,
  Content: ToolCallCardContent,
  Footer: ToolCallCardFooter,
  Button: ToolCallCardButton,
});
