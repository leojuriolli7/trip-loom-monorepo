import { LandingChatDemo } from "./landing-chat-demo";
import { LandingCTA } from "./landing-cta";
import { LandingFeatures } from "./landing-features";
import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";

export function LandingPage() {
  return (
    <div data-testid="landing-page" className="flex min-h-screen flex-col bg-background selection:bg-primary/10 selection:text-primary">
      <LandingHeader />

      <main className="flex-1">
        <LandingHero />
        <LandingChatDemo />
        <LandingFeatures />
        <LandingCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
