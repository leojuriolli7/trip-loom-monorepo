import { RecommendedDestinationsSection } from "./recommended-destinations-section";
import { CurrentTripCta } from "./current-trip-cta";
import { Greeting } from "./greeting";
import { YourTripsSection } from "./your-trips-section/your-trips-section";

export function WelcomeScreen() {
  return (
    <main className="pb-16">
      <Greeting />

      <div className="space-y-12">
        <CurrentTripCta />

        <YourTripsSection />

        <RecommendedDestinationsSection />
      </div>
    </main>
  );
}
