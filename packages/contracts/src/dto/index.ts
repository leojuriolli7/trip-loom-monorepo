export {
  type UserPreferenceDTO,
  type UserPreferenceInput,
} from "./user-preferences";

export { type PaginatedResponse } from "./common";

export {
  type DestinationDTO,
  type DestinationQuery,
  type DestinationDetailDTO,
  type DestinationHotelSummaryDTO,
  type RecommendedDestinationDTO,
  type RecommendedDestinationsQuery,
} from "./destinations";

export { type HotelDTO, type HotelQuery } from "./hotels";

export {
  type AirportSummaryDTO,
  type FlightSeat,
  type FlightSeatRow,
  type FlightSeatMap,
  type FlightSearchQuery,
  type FlightOptionDTO,
  type FlightBookingDTO,
  type FlightBookingDetailDTO,
  type CreateFlightBookingInput,
} from "./flights";

export {
  type HotelSummaryDTO,
  type HotelBookingDTO,
  type CreateHotelBookingInput,
} from "./hotel-bookings";

export {
  type CreateActivityInput,
  type CreateDayInput,
  type CreateItineraryInput,
  type ItineraryActivityDTO,
  type ItineraryDayDTO,
  type ItineraryDetailDTO,
  type UpdateActivityInput,
  type UpdateDayInput,
} from "./itineraries";

export {
  type PaymentDTO,
  type CreatePaymentIntentInput,
  type PaymentIntentResponse,
  type ConfirmPaymentInput,
  type RefundPaymentInput,
} from "./payments";

export {
  type TripDTO,
  type TripWithDestinationDTO,
  type TripFlightBookingDTO,
  type TripHotelBookingDTO,
  type TripPaymentDTO,
  type TripDetailDTO,
  type CreateTripInput,
  type UpdateTripInput,
  type TripQuery,
} from "./trips";

export { tripStatusValues, type TripStatus } from "../enums";
