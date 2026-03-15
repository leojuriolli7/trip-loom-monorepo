"use client";

import type { ComponentProps } from "react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { springs, STAGGER_DELAY } from "@/lib/motion";
import { useCallback } from "react";

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: STAGGER_DELAY }}
      className={cn("flex w-max flex-nowrap items-center gap-2", className)}
    >
      {children}
    </motion.div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = useCallback(() => {
    onClick?.(suggestion);
  }, [onClick, suggestion]);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={springs.snappy}
    >
      <Button
        className={cn("cursor-pointer rounded-full px-4", className)}
        onClick={handleClick}
        size={size}
        type="button"
        variant={variant}
        {...props}
      >
        {children || suggestion}
      </Button>
    </motion.div>
  );
};
