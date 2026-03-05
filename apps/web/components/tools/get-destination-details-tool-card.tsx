import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { useQuery } from "@tanstack/react-query";
import { destinationQueries } from "@/lib/api/react-query/destinations";
import Image from "next/image";

type GetDestinationDetailsToolCardProps = {
  args: TripLoomToolArgsByName<"get_destination_details">;
};

// TODO: Can render destination details dialog here -- good to put this dialog at the top of a layout and always have it available to open via store
export function GetDestinationDetailsToolCard({
  args,
}: GetDestinationDetailsToolCardProps) {
  const { data: destinationDetails, status } = useQuery({
    ...destinationQueries.getDestinationById(args?.destinationId),
    enabled: !!args?.destinationId,
  });

  if (status !== "success") return null;

  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <Image
          src={
            destinationDetails?.data?.imagesUrls?.[0].url || "/placeholder.png"
          }
          width={48}
          height={48}
          alt={""}
          className={"object-cover w-12 h-12 rounded-2xl shrink-0"}
        />

        <div className="space-y-0.5">
          <ToolCallCard.Title>
            In-depth look at {destinationDetails?.data?.name}
          </ToolCallCard.Title>
          <ToolCallCard.Description>
            {destinationDetails?.data?.description}
          </ToolCallCard.Description>
        </div>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
