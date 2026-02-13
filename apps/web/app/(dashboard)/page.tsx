import { Greeting } from "./_components/greeting";
import { Header } from "./_components/header";
import { HomeChatInput } from "./_components/home-chat-input";
import { TripsCarousel } from "./_components/trips-carousel";
import { DestinationsCarousel } from "./_components/destinations-carousel";

import { pastTrips, suggestedDestinations, upcomingTrips } from "./_mocks";
import { mockUser } from "@/lib/mockUser";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <Greeting userName={mockUser.name} />

        <div className="space-y-12 pb-16">
          <HomeChatInput />

          {/*
            Still unsure about actions here, should clicking on card:
            - Open a dialog with more information:
              - Actions like: Read itinerary, edit itinerary (redirects to AI Chat + prompt)
              - If user hasn't booked a hotel/plane: Book X (redirects to AI Chat + prompt)
            */}
          <TripsCarousel title="Upcoming trips" trips={upcomingTrips} />

          {/*
            Same as above, but past trips so less actions to do.
            */}
          <TripsCarousel
            title="Past trips"
            trips={pastTrips}
            emptyMessage="You haven't taken any trips yet"
          />

          {/*
            Clicking could open dialog with more information + Actions like:
            - Ask AI about activies
            - Ask AI to plan your trip
            etc...
            */}
          <DestinationsCarousel
            title="Recommended for you"
            subtitle="Destinations we think you'll love based on your travel history"
            destinations={suggestedDestinations}
          />
        </div>
      </main>

      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            TripLoom &mdash; Your AI travel agent, weaving everything together.
          </p>
        </div>
      </footer>
    </div>
  );
}
