import {
  ClockIcon,
  MapPinIcon,
  ExternalLinkIcon,
} from "lucide-react";
import type { ItineraryDetailDTO } from "@trip-loom/contracts/dto";
import { format } from "date-fns";
import { parseIsoDate } from "@/lib/parse-iso-date";

type SharedItinerarySectionProps = {
  itinerary: ItineraryDetailDTO;
};

export function SharedItinerarySection({
  itinerary,
}: SharedItinerarySectionProps) {
  if (!itinerary.days || itinerary.days.length === 0) {
    return null;
  }

  return (
    <section data-testid="shared-itinerary-section">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">Itinerary</h2>

      <div className="space-y-6">
        {itinerary.days.map((day) => (
          <div key={day.id} className="space-y-3">
            <div className="flex items-baseline gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {day.dayNumber}
              </span>
              <div>
                <h3 className="font-medium">
                  {day.title ?? `Day ${day.dayNumber}`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {format(parseIsoDate(day.date), "EEEE, MMM d, yyyy")}
                </p>
              </div>
            </div>

            {day.activities && day.activities.length > 0 ? (
              <div className="ml-3.5 space-y-2 border-l-2 border-border/50 pl-5">
                {day.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-border/40 bg-card p-3.5 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.googleMapsUrl && (
                        <a
                          href={activity.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLinkIcon className="size-3.5" />
                        </a>
                      )}
                    </div>

                    {activity.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {(activity.startTime || activity.endTime) && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="size-3" />
                          {activity.startTime}
                          {activity.endTime && ` - ${activity.endTime}`}
                        </span>
                      )}

                      {(activity.googlePlaceDisplayName || activity.location) && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="size-3" />
                          {activity.googlePlaceDisplayName ?? activity.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ml-3.5 border-l-2 border-border/50 pl-5 text-sm text-muted-foreground">
                No activities planned
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
