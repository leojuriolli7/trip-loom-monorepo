import { MessageCircleMoreIcon } from "lucide-react";
import { Greeting } from "./_components/greeting";
import { Header } from "./_components/header";

const mockUser = {
  name: "Leonardo",
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <Greeting userName={mockUser.name} />

        <section className="border-t border-border/40 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8 lg:py-12">
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircleMoreIcon className="text-primary size-8" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium text-foreground">
                    Chat area coming soon
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    This is where you&apos;ll chat with your AI travel agent to
                    plan and book your trips.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
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
