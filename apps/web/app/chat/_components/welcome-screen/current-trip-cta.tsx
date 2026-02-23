"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { tripQueries } from "@/lib/api/react-query/trips";
import { CurrentTripCard } from "@/components/current-trip-card";
import { useRouter } from "next/navigation";
import { focusChatInput } from "../chat-input-focus";

export function CurrentTripCta() {
  const router = useRouter();

  const { data: currentTrips = [] } = useInfiniteQuery(
    tripQueries.listTrips({
      status: ["current"],
      limit: 1,
    }),
  );

  const currentTrip = currentTrips[0];

  const handleContinueCurrentTrip = () => {
    if (!currentTrip?.id) {
      return;
    }

    router.push(`/chat/${currentTrip.id}`);
    focusChatInput();
  };

  if (!currentTrip) {
    return null;
  }

  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8">
      <h3 className="text-lg font-semibold">Message your trip assistant</h3>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">
        Need to change your itinerary or book your return flight?
      </p>

      <CurrentTripCard
        trip={currentTrip}
        onContinue={handleContinueCurrentTrip}
      />
    </section>
  );
}
