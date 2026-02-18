import {
  amenityEnum,
  bookingStatusEnum,
  cabinClassEnum,
  flightTypeEnum,
  paymentStatusEnum,
  priceRangeEnum,
  regionEnum,
  travelInterestEnum,
  tripStatusEnum,
} from "./db/schema";

export const tripStatusValues = tripStatusEnum.enumValues;
export type TripStatus = (typeof tripStatusValues)[number];

export const flightTypeValues = flightTypeEnum.enumValues;
export type FlightType = (typeof flightTypeValues)[number];

export const cabinClassValues = cabinClassEnum.enumValues;
export type CabinClass = (typeof cabinClassValues)[number];

export const bookingStatusValues = bookingStatusEnum.enumValues;
export type BookingStatus = (typeof bookingStatusValues)[number];

export const priceRangeValues = priceRangeEnum.enumValues;
export type PriceRange = (typeof priceRangeValues)[number];

// Alias used by user preferences copy where this enum represents a user's budget.
export const budgetRangeValues = priceRangeValues;
export type BudgetRange = PriceRange;

export const paymentStatusValues = paymentStatusEnum.enumValues;
export type PaymentStatus = (typeof paymentStatusValues)[number];

export const travelInterestValues = travelInterestEnum.enumValues;
export type TravelInterest = (typeof travelInterestValues)[number];

export const amenityValues = amenityEnum.enumValues;
export type Amenity = (typeof amenityValues)[number];

export const regionValues = regionEnum.enumValues;
export type Region = (typeof regionValues)[number];
