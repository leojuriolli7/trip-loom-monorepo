import { LandingHero } from "@/components/landing-page/landing-hero";
import { LandingChatDemo } from "@/components/landing-page/landing-chat-demo";
import { LandingFeatures } from "@/components/landing-page/landing-features";
import { LandingCTA } from "@/components/landing-page/landing-cta";
import { LandingHeader } from "@/components/landing-page/landing-header";
import { LandingFooter } from "@/components/landing-page/landing-footer";
import { getServerSession } from "@/lib/api/server-session";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession();
  const { user } = session || {};

  if (!!user) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10 selection:text-primary">
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
