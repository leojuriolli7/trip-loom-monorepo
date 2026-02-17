import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "./schema";

// DB model types (prefixed with DB_ to distinguish from DTOs)
export type DB_Destination = InferSelectModel<typeof schema.destination>;
export type DB_NewDestination = InferInsertModel<typeof schema.destination>;

export type DB_Airport = InferSelectModel<typeof schema.airport>;
export type DB_NewAirport = InferInsertModel<typeof schema.airport>;

export type DB_Hotel = InferSelectModel<typeof schema.hotel>;
export type DB_NewHotel = InferInsertModel<typeof schema.hotel>;

export type DB_Trip = InferSelectModel<typeof schema.trip>;
export type DB_NewTrip = InferInsertModel<typeof schema.trip>;

export type DB_FlightBooking = InferSelectModel<typeof schema.flightBooking>;
export type DB_NewFlightBooking = InferInsertModel<typeof schema.flightBooking>;

export type DB_HotelBooking = InferSelectModel<typeof schema.hotelBooking>;
export type DB_NewHotelBooking = InferInsertModel<typeof schema.hotelBooking>;

export type DB_Itinerary = InferSelectModel<typeof schema.itinerary>;
export type DB_NewItinerary = InferInsertModel<typeof schema.itinerary>;

export type DB_ItineraryDay = InferSelectModel<typeof schema.itineraryDay>;
export type DB_NewItineraryDay = InferInsertModel<typeof schema.itineraryDay>;

export type DB_ItineraryActivity = InferSelectModel<
  typeof schema.itineraryActivity
>;
export type DB_NewItineraryActivity = InferInsertModel<
  typeof schema.itineraryActivity
>;

export type DB_Payment = InferSelectModel<typeof schema.payment>;
export type DB_NewPayment = InferInsertModel<typeof schema.payment>;

export type DB_UserPreference = InferSelectModel<typeof schema.userPreference>;
export type DB_NewUserPreference = InferInsertModel<
  typeof schema.userPreference
>;

export type DB_StripeWebhookEvent = InferSelectModel<
  typeof schema.stripeWebhookEvent
>;
export type DB_NewStripeWebhookEvent = InferInsertModel<
  typeof schema.stripeWebhookEvent
>;
