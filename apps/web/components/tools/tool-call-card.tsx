import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StreamingImage } from "../streaming-image";

const toolCallCardRootVariants = cva(
  "relative animate-chat-enter overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-card via-card to-secondary/25 shadow-[0_10px_18px_-18px_rgba(15,23,42,0.5)]",
  {
    variants: {
      size: {
        sm: "p-4",
        lg: "p-4 md:p-5",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

const toolCallCardHeaderVariants = cva("flex min-w-0 items-start", {
  variants: {
    size: {
      sm: "gap-3",
      lg: "gap-4",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

const toolCallCardHeaderContentVariants = cva("min-w-0 flex-1", {
  variants: {
    size: {
      sm: "space-y-0.5",
      lg: "space-y-1 pt-2",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

const toolCallCardImageVariants = cva(
  "relative shrink-0 rounded-2xl border border-border/60 bg-background/75 p-2",
  {
    variants: {
      size: {
        sm: "size-12",
        lg: "size-16",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

type ToolCallCardSize = NonNullable<
  VariantProps<typeof toolCallCardRootVariants>["size"]
>;

const ToolCallCardSizeContext = createContext<ToolCallCardSize>("sm");

function useToolCallCardSize() {
  return useContext(ToolCallCardSizeContext);
}

type ToolCallCardRootProps = ComponentProps<"section"> &
  VariantProps<typeof toolCallCardRootVariants>;

function ToolCallCardRoot({
  children,
  className,
  size = "sm",
  ...props
}: ToolCallCardRootProps) {
  const resolvedSize: ToolCallCardSize = size ?? "sm";

  return (
    <ToolCallCardSizeContext.Provider value={resolvedSize}>
      <section
        data-size={resolvedSize}
        data-slot="tool-call-card"
        className={cn(
          toolCallCardRootVariants({ size: resolvedSize }),
          className,
        )}
        {...props}
      >
        {children}
      </section>
    </ToolCallCardSizeContext.Provider>
  );
}

function ToolCallCardImage({
  className,
  src,
  alt,
  size,
  ...props
}: ComponentProps<"div"> & {
  src: string;
  alt: string;
  size?: ToolCallCardSize;
}) {
  const inheritedSize = useToolCallCardSize();
  const resolvedSize = size ?? inheritedSize;

  return (
    <div
      data-size={resolvedSize}
      data-slot="tool-call-card-image"
      className={toolCallCardImageVariants({ size: resolvedSize })}
      {...props}
    >
      <StreamingImage
        src={src}
        alt={alt}
        fill
        sizes={resolvedSize === "sm" ? "48px" : "64px"}
        className={cn("object-contain", className)}
      />
    </div>
  );
}

function ToolCallCardHeader({ className, ...props }: ComponentProps<"div">) {
  const size = useToolCallCardSize();

  return (
    <div
      data-slot="tool-call-card-header"
      className={cn(toolCallCardHeaderVariants({ size }), className)}
      {...props}
    />
  );
}

function ToolCallCardHeaderContent({
  className,
  ...props
}: ComponentProps<"div">) {
  const size = useToolCallCardSize();

  return (
    <div
      data-slot="tool-call-card-header-content"
      className={cn(toolCallCardHeaderContentVariants({ size }), className)}
      {...props}
    />
  );
}

function ToolCallCardTitle({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="tool-call-card-title"
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
      data-slot="tool-call-card-description"
      className={cn(
        "text-sm leading-relaxed text-muted-foreground first-letter:uppercase",
        className,
      )}
      {...props}
    />
  );
}

function ToolCallCardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="tool-call-card-content"
      className={cn("mt-2.5 space-y-0.5", className)}
      {...props}
    />
  );
}

function ToolCallCardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="tool-call-card-footer"
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
      data-slot="tool-call-card-button"
      className={cn("rounded-full px-4", className)}
      size={size}
      {...props}
    />
  );
}

export const ToolCallCard = Object.assign(ToolCallCardRoot, {
  Header: ToolCallCardHeader,
  HeaderContent: ToolCallCardHeaderContent,
  Title: ToolCallCardTitle,
  Description: ToolCallCardDescription,
  Content: ToolCallCardContent,
  Footer: ToolCallCardFooter,
  Image: ToolCallCardImage,
  Button: ToolCallCardButton,
});
