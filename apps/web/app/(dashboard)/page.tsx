import { Greeting } from "./_components/greeting";
import { Header } from "./_components/header";
import { HomeChatInput } from "./_components/home-chat-input";
import { TripsSection } from "./_components/trips-section";
import { DestinationsSection } from "./_components/destinations-section";

import { suggestedDestinations } from "./_mocks";
import { auth } from "@trip-loom/api/auth";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

export default async function Page() {
  const headersStore = await headers();

  // This gets deduplicated with the call from layout.tsx above this page
  const sessionResult = await auth.api.getSession({ headers: headersStore });

  if (!sessionResult?.user) {
    unauthorized();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <Greeting userName={sessionResult?.user.name} />

        <div className="space-y-12 pb-16">
          <HomeChatInput />

          {/*
            TODO: Since trips have been decided as each having 1 chat (Can read more in chat/page.tsx)
            we should make these redirect to that conversation in /chat.
            */}
          <TripsSection
            title="Upcoming trips"
            status="upcoming"
            emptyMessage="You don't have any trips coming up"
            emptyMessageIcon="/colliseum.png"
          />

          {/*
            TOOD: Same as above.
            */}
          <TripsSection
            title="Past trips"
            status="past"
            emptyMessage="You haven't taken any trips yet"
            emptyMessageIcon="/pyramid.png"
          />

          {/*
            TODO: Clicking could open dialog with more information + Actions like:
            - Ask AI about activies
            - Ask AI to plan your trip
            etc...
            */}
          <DestinationsSection
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
