export {
  cabinClassValues,
  budgetRangeValues,
  travelInterestValues,
  regionValues,
  travelInterestSchema,
  regionSchema,
  userPreferenceSchema,
  userPreferenceInputSchema,
  type TravelInterest,
  type Region,
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
  type DestinationDTO,
  type DestinationQuery,
} from "./destinations";

export {
  hotelSchema,
  hotelQuerySchema,
  type HotelDTO,
  type HotelQuery,
} from "./hotels";

export {
  flightBookingStatusValues,
  flightTypeValues,
  flightBookingCabinClassValues,
  flightBookingSchema,
  type FlightBookingDTO,
} from "./flight-bookings";

export {
  hotelBookingStatusValues,
  hotelBookingSchema,
  type HotelBookingDTO,
} from "./hotel-bookings";

export {
  itineraryActivitySchema,
  itineraryDaySchema,
  itineraryDetailSchema,
  type ItineraryActivityDTO,
  type ItineraryDayDTO,
  type ItineraryDetailDTO,
} from "./itineraries";

export {
  paymentStatusValues,
  paymentSchema,
  type PaymentDTO,
} from "./payments";

export {
  tripStatusValues,
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
