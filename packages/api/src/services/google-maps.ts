import type {
  GetPlaceDetailsInput,
  GooglePlaceDetails,
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
