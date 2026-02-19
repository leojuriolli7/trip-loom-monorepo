import { Greeting } from "./_components/greeting";
import { Header } from "./_components/header";
import { HomeChatInput } from "./_components/home-chat-input";
import { TripsSection } from "./_components/trips-section";
import { DestinationsSection } from "./_components/destinations-section";

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
           * TODO: A carousel might not be the best fit since it's hard for users
           * to have more than 1 upcoming trip. Could add some kind of filler card, like
           * explaining features or CTA to something.
           */}

          <TripsSection
            title="Upcoming trips"
            status="upcoming"
            emptyMessage="You don't have any trips coming up"
            emptyMessageIcon="/colliseum.png"
          />

          <TripsSection
            title="Past trips"
            status="past"
            emptyMessage="You haven't taken any trips yet"
            emptyMessageIcon="/pyramid.png"
          />

          <DestinationsSection
            title="Recommended for you"
            subtitle="Based on your preferences and travel history"
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
