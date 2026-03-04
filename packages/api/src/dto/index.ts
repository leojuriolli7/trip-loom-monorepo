export {
  travelInterestSchema,
  regionSchema,
  userPreferenceSchema,
  userPreferenceInputSchema,
  type UserPreferenceDTO,
  type UserPreferenceInput,
} from "./user-preferences";

export {
  errorResponseSchema,
  paginatedResponseSchema,
  type PaginatedResponse,
} from "./common";

export {
  destinationSchema,
  destinationQuerySchema,
  destinationDetailSchema,
  destinationHotelSummarySchema,
  recommendedDestinationSchema,
  recommendedDestinationsQuerySchema,
  type DestinationDTO,
  type DestinationQuery,
  type DestinationDetailDTO,
  type DestinationHotelSummaryDTO,
  type RecommendedDestinationDTO,
  type RecommendedDestinationsQuery,
} from "./destinations";

export {
  hotelSchema,
  hotelQuerySchema,
  type HotelDTO,
  type HotelQuery,
} from "./hotels";

export {
  airportSummarySchema,
  flightSeatSchema,
  flightSeatRowSchema,
  flightSeatMapSchema,
  flightSearchSchema,
  flightOptionSchema,
  flightBookingSchema,
  flightBookingDetailSchema,
  createFlightBookingInputSchema,
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
  hotelSummarySchema,
  hotelBookingSchema,
  createHotelBookingInputSchema,
  type HotelSummaryDTO,
  type HotelBookingDTO,
  type CreateHotelBookingInput,
} from "./hotel-bookings";

export {
  createActivityInputSchema,
  createDayInputSchema,
  createItineraryInputSchema,
  itineraryActivitySchema,
  itineraryDaySchema,
  itineraryDetailSchema,
  updateActivityInputSchema,
  updateDayInputSchema,
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
  paymentBookingTypeValues,
  paymentBookingTypeSchema,
  paymentSchema,
  createPaymentIntentInputSchema,
  paymentIntentResponseSchema,
  confirmPaymentInputSchema,
  refundPaymentInputSchema,
  stripeWebhookResponseSchema,
  type PaymentDTO,
  type CreatePaymentIntentInput,
  type PaymentIntentResponse,
  type ConfirmPaymentInput,
  type RefundPaymentInput,
} from "./payments";

export {
  chatInputSchema,
  chatMessageSchema,
  chatHistoryResponseSchema,
  type ChatInput,
  type ChatMessageDTO,
  type ChatHistoryResponse,
} from "./chat";

export {
  tripSchema,
  tripWithDestinationSchema,
  tripDetailSchema,
  createTripInputSchema,
  updateTripInputSchema,
  tripQuerySchema,
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
