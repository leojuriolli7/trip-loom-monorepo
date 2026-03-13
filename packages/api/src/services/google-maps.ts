import type {
  GetPlaceDetailsInput,
  GooglePlaceDetails,
  GooglePlaceEnrichedDetails,
  GooglePlaceSummary,
  SearchPlacesInput,
} from "@trip-loom/contracts/dto";
import { googleMapsProvider } from "../lib/google-maps/provider";

export async function searchPlaces(
  input: SearchPlacesInput,
): Promise<GooglePlaceSummary[]> {
  return googleMapsProvider.searchPlaces(input);
}

export async function getPlaceDetails(
  input: GetPlaceDetailsInput,
): Promise<GooglePlaceDetails> {
  return googleMapsProvider.getPlaceDetails(input);
}

export async function getEnrichedPlaceDetails(
  input: GetPlaceDetailsInput,
): Promise<GooglePlaceEnrichedDetails> {
  return googleMapsProvider.getEnrichedPlaceDetails(input);
}
