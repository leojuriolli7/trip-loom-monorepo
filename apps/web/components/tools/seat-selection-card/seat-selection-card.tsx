"use client";

import type { FlightOptionDTO } from "@trip-loom/contracts/dto";
import { AirplaneSeatView } from "./airplane-seat-view/airplane-seat-view";

type SeatSelectionInterruptValue = {
  type: "request-seat-selection";
  flightOptionId: string;
  flightNumber: string;
  airline: string;
  departureAirportCode: string;
  departureCity: string;
  departureTime: string;
  arrivalAirportCode: string;
  arrivalCity: string;
  arrivalTime: string;
  durationMinutes: number;
  cabinClass: FlightOptionDTO["cabinClass"];
  priceInCents: number;
  seatMap: FlightOptionDTO["seatMap"];
};

type SeatSelectionCardProps = {
  value: SeatSelectionInterruptValue;
  disabled?: boolean;
  onConfirm: (seatId: string) => void;
  onCancel: () => void;
};

export function SeatSelectionCard({
  value,
  disabled,
  onConfirm,
  onCancel,
}: SeatSelectionCardProps) {
  const flight = {
    id: value.flightOptionId,
    flightNumber: value.flightNumber,
    departureAirportCode: value.departureAirportCode,
    departureCity: value.departureCity,
    departureTime: value.departureTime,
    arrivalAirportCode: value.arrivalAirportCode,
    arrivalCity: value.arrivalCity,
    arrivalTime: value.arrivalTime,
    durationMinutes: value.durationMinutes,
    cabinClass: value.cabinClass,
    priceInCents: value.priceInCents,
    seatMap: value.seatMap,
  };

  return (
    <AirplaneSeatView
      title="Select Your Seat"
      flight={flight}
      onConfirm={(seatId) => {
        if (!disabled) {
          onConfirm(seatId);
        }
      }}
      onCancel={() => {
        if (!disabled) {
          onCancel();
        }
      }}
    />
  );
}
