import type { ComponentType } from "react";

type SectionHeadingProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

export function SectionHeading({
  icon: Icon,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/40 text-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h4>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
