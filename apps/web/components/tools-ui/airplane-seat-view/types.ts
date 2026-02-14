/**
 * TODO: All these types will be changed when we have a real API in charge.
 * eg: dates will be actual date formats, price will be in cents, cabin class will be an enum...
 *
 * Departure time and arrival time will be timezone based dates etc...
 */

export interface Seat {
  /** Unique seat identifier, e.g., "1A", "12C" */
  id: string;
  /** Price in dollars */
  price: number;
  /** Whether the seat is already booked */
  isBooked: boolean;
}

export interface SeatRow {
  /** Row number displayed on the side */
  rowNumber: number;
  /**
   * Groups of seats separated by aisles.
   * e.g., [[A, B], [C, D]] for 2-2 config
   * e.g., [[A, B, C], [D, E, F]] for 3-3 config
   * e.g., [[A, B], [C, D, E], [F, G]] for 2-3-2 wide-body
   */
  sections: Seat[][];
}

export interface FlightInfo {
  /** Departure airport code (e.g., "JFK") */
  fromCode: string;
  /** Departure city name (e.g., "New York") */
  fromCity: string;
  /** Departure time (e.g., "08:30") */
  departureTime: string;
  /** Arrival airport code (e.g., "LAX") */
  toCode: string;
  /** Arrival city name (e.g., "Los Angeles") */
  toCity: string;
  /** Arrival time (e.g., "11:45") */
  arrivalTime: string;
  /** Flight duration (e.g., "5h 15m") */
  duration: string;
}

export type PriceTier = "cheap" | "medium" | "expensive";

export interface PriceStats {
  avg: number;
  min: number;
  max: number;
}
