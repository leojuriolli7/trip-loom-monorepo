import { RecommendedDestinationsSection } from "./recommended-destinations-section";
import { CurrentTripCta } from "./current-trip-cta";
import { Greeting } from "./greeting";
import { YourTripsSection } from "./your-trips-section/your-trips-section";

export function WelcomeScreen({ userName }: { userName: string }) {
  return (
    <main className="pb-16">
      <Greeting userName={userName} />

      <div className="space-y-12">
        <CurrentTripCta />

        <YourTripsSection />

        <RecommendedDestinationsSection />
      </div>
    </main>
  );
}
