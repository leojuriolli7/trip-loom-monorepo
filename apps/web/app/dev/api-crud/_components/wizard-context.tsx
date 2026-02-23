"use client";

import * as React from "react";
import type {
  TripDetailDTO,
  DestinationDTO,
  FlightBookingDTO,
  HotelBookingDTO,
  PaymentDTO,
  ItineraryDetailDTO,
} from "@trip-loom/api/dto";

export type WizardStep =
  | "create-trip"
  | "book-outbound-flight"
  | "pay-outbound-flight"
  | "book-return-flight"
  | "pay-return-flight"
  | "book-hotel"
  | "pay-hotel"
  | "create-itinerary"
  | "summary";

const STEPS: WizardStep[] = [
  "create-trip",
  "book-outbound-flight",
  "pay-outbound-flight",
  "book-return-flight",
  "pay-return-flight",
  "book-hotel",
  "pay-hotel",
  "create-itinerary",
  "summary",
];

type WizardState = {
  currentStep: WizardStep;
  trip: TripDetailDTO | null;
  destination: DestinationDTO | null;
  outboundFlight: FlightBookingDTO | null;
  outboundPayment: PaymentDTO | null;
  returnFlight: FlightBookingDTO | null;
  returnPayment: PaymentDTO | null;
  hotelBooking: HotelBookingDTO | null;
  hotelPayment: PaymentDTO | null;
  itinerary: ItineraryDetailDTO | null;
};

type WizardActions = {
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTrip: (trip: TripDetailDTO) => void;
  setDestination: (destination: DestinationDTO) => void;
  setOutboundFlight: (flight: FlightBookingDTO) => void;
  setOutboundPayment: (payment: PaymentDTO) => void;
  setReturnFlight: (flight: FlightBookingDTO) => void;
  setReturnPayment: (payment: PaymentDTO) => void;
  setHotelBooking: (booking: HotelBookingDTO) => void;
  setHotelPayment: (payment: PaymentDTO) => void;
  setItinerary: (itinerary: ItineraryDetailDTO) => void;
  reset: () => void;
};

type WizardContextValue = WizardState & WizardActions;

const WizardContext = React.createContext<WizardContextValue | null>(null);

const initialState: WizardState = {
  currentStep: "create-trip",
  trip: null,
  destination: null,
  outboundFlight: null,
  outboundPayment: null,
  returnFlight: null,
  returnPayment: null,
  hotelBooking: null,
  hotelPayment: null,
  itinerary: null,
};

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<WizardState>(initialState);

  const goToStep = React.useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = React.useCallback(() => {
    setState((prev) => {
      const currentIndex = STEPS.indexOf(prev.currentStep);
      if (currentIndex < STEPS.length - 1) {
        return { ...prev, currentStep: STEPS[currentIndex + 1] };
      }
      return prev;
    });
  }, []);

  const prevStep = React.useCallback(() => {
    setState((prev) => {
      const currentIndex = STEPS.indexOf(prev.currentStep);
      if (currentIndex > 0) {
        return { ...prev, currentStep: STEPS[currentIndex - 1] };
      }
      return prev;
    });
  }, []);

  const setTrip = React.useCallback((trip: TripDetailDTO) => {
    setState((prev) => ({ ...prev, trip }));
  }, []);

  const setDestination = React.useCallback((destination: DestinationDTO) => {
    setState((prev) => ({ ...prev, destination }));
  }, []);

  const setOutboundFlight = React.useCallback((flight: FlightBookingDTO) => {
    setState((prev) => ({ ...prev, outboundFlight: flight }));
  }, []);

  const setOutboundPayment = React.useCallback((payment: PaymentDTO) => {
    setState((prev) => ({ ...prev, outboundPayment: payment }));
  }, []);

  const setReturnFlight = React.useCallback((flight: FlightBookingDTO) => {
    setState((prev) => ({ ...prev, returnFlight: flight }));
  }, []);

  const setReturnPayment = React.useCallback((payment: PaymentDTO) => {
    setState((prev) => ({ ...prev, returnPayment: payment }));
  }, []);

  const setHotelBooking = React.useCallback((booking: HotelBookingDTO) => {
    setState((prev) => ({ ...prev, hotelBooking: booking }));
  }, []);

  const setHotelPayment = React.useCallback((payment: PaymentDTO) => {
    setState((prev) => ({ ...prev, hotelPayment: payment }));
  }, []);

  const setItinerary = React.useCallback((itinerary: ItineraryDetailDTO) => {
    setState((prev) => ({ ...prev, itinerary }));
  }, []);

  const reset = React.useCallback(() => {
    setState(initialState);
  }, []);

  const value = React.useMemo<WizardContextValue>(
    () => ({
      ...state,
      goToStep,
      nextStep,
      prevStep,
      setTrip,
      setDestination,
      setOutboundFlight,
      setOutboundPayment,
      setReturnFlight,
      setReturnPayment,
      setHotelBooking,
      setHotelPayment,
      setItinerary,
      reset,
    }),
    [
      state,
      goToStep,
      nextStep,
      prevStep,
      setTrip,
      setDestination,
      setOutboundFlight,
      setOutboundPayment,
      setReturnFlight,
      setReturnPayment,
      setHotelBooking,
      setHotelPayment,
      setItinerary,
      reset,
    ],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard() {
  const context = React.useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

export function getStepIndex(step: WizardStep): number {
  return STEPS.indexOf(step);
}

export function getStepLabel(step: WizardStep): string {
  const labels: Record<WizardStep, string> = {
    "create-trip": "Create Trip",
    "book-outbound-flight": "Outbound Flight",
    "pay-outbound-flight": "Pay Flight",
    "book-return-flight": "Return Flight",
    "pay-return-flight": "Pay Flight",
    "book-hotel": "Book Hotel",
    "pay-hotel": "Pay Hotel",
    "create-itinerary": "Itinerary",
    summary: "Summary",
  };
  return labels[step];
}

export { STEPS };
