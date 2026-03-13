import { cn } from "@/lib/utils";
import { MapIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

export function MapCtaCard({
  onClick,
  className,
}: {
  className?: string;
  onClick: () => void;
}) {
  const { resolvedTheme: theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-3 group cursor-pointer rounded-xl text-left transition-transform hover:scale-[1.01]",
        className,
      )}
    >
      <div className="relative w-full  h-full overflow-hidden transition-transform rounded-lg border border-border/50 bg-muted/50">
        <div className="w-full h-full group-hover:bg-black/30 z-1 absolute top-0 left-0" />

        <MapIcon className="size-6 group-hover:block hidden absolute z-2 inset-0 m-auto group-hover:scale-110 scale-90 transition-transform text-white drop-shadow-lg" />

        <Image
          src={
            theme === "dark"
              ? "/google-maps-preview-dark.png"
              : "/google-maps-preview.webp"
          }
          alt="Open itinerary map"
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
    </button>
  );
}
