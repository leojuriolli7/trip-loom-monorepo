import { exploreDestinationsPrompt } from "./explore-destinations";
import { bookAccommodationsPrompt } from "./book-accommodations";
import { planItineraryPrompt } from "./plan-itinerary";
import { planTripToDestinationPrompt } from "./plan-trip-to-destination";
import { askDestinationActivitiesPrompt } from "./ask-destination-activities";

/** All prompt definitions as an array */
export const PROMPT_DEFINITIONS = [
  exploreDestinationsPrompt,
  bookAccommodationsPrompt,
  planItineraryPrompt,
  planTripToDestinationPrompt,
  askDestinationActivitiesPrompt,
] as const;

/** Type-safe lookup by prompt name */
export const PROMPTS = {
  explore_destinations: exploreDestinationsPrompt,
  book_accommodations: bookAccommodationsPrompt,
  plan_itinerary: planItineraryPrompt,
  plan_trip_to_destination: planTripToDestinationPrompt,
  ask_destination_activities: askDestinationActivitiesPrompt,
} as const;

export type PromptName = keyof typeof PROMPTS;
