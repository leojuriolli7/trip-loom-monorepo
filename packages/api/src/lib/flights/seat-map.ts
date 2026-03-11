import type { FlightBookingDTO } from "@trip-loom/contracts/dto/flights";

type SeatMapSource = {
  flightNumber: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: Date;
  arrivalTime: Date;
  cabinClass: FlightBookingDTO["cabinClass"];
};

export function buildSeatMapSeedKey(source: SeatMapSource): string {
  return [
    source.flightNumber,
    source.departureAirportCode,
    source.arrivalAirportCode,
    source.departureTime.toISOString(),
    source.arrivalTime.toISOString(),
    source.cabinClass,
  ].join("|");
}
