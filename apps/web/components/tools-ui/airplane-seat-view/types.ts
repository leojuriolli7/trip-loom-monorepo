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

export interface AirplaneSeatViewProps {
  /** Array of seat rows defining the plane layout */
  rows: SeatRow[];
  /** Initially selected seat ID */
  initialSelectedSeatId: string;
  /** Cabin class label (e.g., "Business", "Economy") */
  cabinClass: string;
  /** Flight number for display */
  flightNumber: string;
  /** Flight route and time information */
  flightInfo: FlightInfo;
  /**
   * Called when user confirms seat selection.
   * TODO: Will trigger AI booking flow
   */
  onConfirm?: (seatId: string, price: number) => void;
  /**
   * Called when user cancels seat selection.
   * TODO: Will close the seat picker widget
   */
  onCancel?: () => void;
  /**
   * Called when user wants to request changes.
   * TODO: Will send message to AI for different options
   */
  onRequestChanges?: (message: string) => void;
}

export type PriceTier = "cheap" | "medium" | "expensive";

export interface PriceStats {
  avg: number;
  min: number;
  max: number;
}
