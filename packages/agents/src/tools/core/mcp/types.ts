import type {
  CreateActivityInput,
  CreateDayInput,
  CreateFlightBookingInput,
  CreateHotelBookingInput,
  DestinationQuery,
  FlightSearchQuery,
  HotelQuery,
  RecommendedDestinationsQuery,
  UpdateActivityInput,
  UpdateTripInput,
} from "@trip-loom/api/dto";
import type { TripLoomMcpToolName } from "../registry";

type WithOptionalKeys<Type, Keys extends keyof Type> = Omit<Type, Keys> &
  Partial<Pick<Type, Keys>>;

type SearchDestinationsArgs = WithOptionalKeys<DestinationQuery, "limit">;
type SearchHotelsArgs = WithOptionalKeys<HotelQuery, "limit">;
type SearchFlightsArgs = WithOptionalKeys<
  FlightSearchQuery,
  "cabinClass" | "passengers"
>;

type CreateItineraryDayInput = CreateDayInput & {
  activities?: CreateActivityInput[];
};

type KnownTripLoomMcpToolArgsByName = {
  get_trip_details: {
    tripId: string;
  };
  update_trip: {
    tripId: string;
  } & UpdateTripInput;
  get_user_preferences: Record<string, never>;
  search_destinations: SearchDestinationsArgs;
  get_destination_details: {
    destinationId: string;
  };
  get_recommended_destinations: WithOptionalKeys<
    RecommendedDestinationsQuery,
    "limit"
  >;
  search_flights: SearchFlightsArgs;
  book_flight: {
    tripId: string;
  } & CreateFlightBookingInput;
  cancel_flight_booking: {
    tripId: string;
    flightBookingId: string;
  };
  search_hotels: SearchHotelsArgs;
  create_hotel_booking: {
    tripId: string;
  } & CreateHotelBookingInput;
  cancel_hotel_booking: {
    tripId: string;
    hotelBookingId: string;
  };
  create_itinerary: {
    tripId: string;
    days?: CreateItineraryDayInput[];
  };
  add_itinerary_day: {
    tripId: string;
  } & CreateDayInput;
  add_itinerary_activity: {
    tripId: string;
    dayId: string;
  } & CreateActivityInput;
  update_itinerary_activity: {
    tripId: string;
    dayId: string;
    activityId: string;
  } & UpdateActivityInput;
  delete_itinerary_activity: {
    tripId: string;
    dayId: string;
    activityId: string;
  };
};

export type TripLoomMcpToolArgsByName = {
  [Name in TripLoomMcpToolName]: Name extends keyof KnownTripLoomMcpToolArgsByName
    ? KnownTripLoomMcpToolArgsByName[Name]
    : Record<string, unknown>;
};
