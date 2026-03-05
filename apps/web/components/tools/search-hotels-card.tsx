import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { amenityLabels } from "@/lib/amenity-labels";

type SearchHotelsToolCardProps = {
  args: TripLoomToolArgsByName<"search_hotels">;
};

function formatSearchHotelsSummary(
  args: TripLoomToolArgsByName<"search_hotels">,
) {
  const filters: string[] = [];

  if (args.search) {
    filters.push(`query "${args.search}"`);
  }

  if (args.priceRange) {
    filters.push(`${args.priceRange} price range`);
  }

  if (typeof args.minRating === "number") {
    filters.push(`minimum rating of ${args.minRating}`);
  }

  if (args.amenity) {
    // amenity is already formatted for UI use
    filters.push(`with ${amenityLabels[args.amenity]}`);
  }

  const limit = args.limit ?? 20;
  const searchScope = `${limit} hotel${limit === 1 ? "" : "s"}`;

  if (filters.length === 0) {
    return `Searched ${searchScope}`;
  }

  return `Searched ${searchScope} using ${filters.join(", ")}`;
}

export function SearchHotelsToolCard({ args }: SearchHotelsToolCardProps) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src="/magnifying-glass.png"
          alt="Magnifying glass"
        />

        <div className="space-y-0.5">
          <ToolCallCard.Title>Looked up hotels</ToolCallCard.Title>
          <ToolCallCard.Description>
            {formatSearchHotelsSummary(args)}
          </ToolCallCard.Description>
        </div>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
