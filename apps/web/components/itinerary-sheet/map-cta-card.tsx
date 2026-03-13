"use client";

import Image from "next/image";

export function MapCtaCard({
  onClick,
  title,
  description,
}: {
  onClick: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-3 rounded-3xl border border-border/60 bg-background/80 p-2 text-left transition-transform hover:scale-[1.01]"
    >
      <div className="relative h-16 w-24 overflow-hidden rounded-2xl border border-border/50 bg-muted/40">
        <Image
          src="/google-maps-preview.webp"
          alt="Open itinerary map"
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      {title ? (
        <div className="pr-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      ) : null}
    </button>
  );
}
