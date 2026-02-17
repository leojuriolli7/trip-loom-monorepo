"use client";

import { useWizard, getStepLabel } from "./wizard-context";
import { StepIndicator } from "./step-indicator";
import {
  CreateTripStep,
  BookFlightStep,
  PayFlightStep,
  BookHotelStep,
  PayHotelStep,
  CreateItineraryStep,
  SummaryStep,
} from "./steps";

export function Wizard() {
  const { currentStep } = useWizard();

  const renderStep = () => {
    switch (currentStep) {
      case "create-trip":
        return <CreateTripStep />;
      case "book-outbound-flight":
        return <BookFlightStep flightType="outbound" />;
      case "pay-outbound-flight":
        return <PayFlightStep flightType="outbound" />;
      case "book-return-flight":
        return <BookFlightStep flightType="return" />;
      case "pay-return-flight":
        return <PayFlightStep flightType="return" />;
      case "book-hotel":
        return <BookHotelStep />;
      case "pay-hotel":
        return <PayHotelStep />;
      case "create-itinerary":
        return <CreateItineraryStep />;
      case "summary":
        return <SummaryStep />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
        <StepIndicator />
        <h2 className="text-lg font-medium text-muted-foreground">
          {getStepLabel(currentStep)}
        </h2>
      </div>
      <div className="mx-auto max-w-2xl">{renderStep()}</div>
    </div>
  );
}
