"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PaymentDTO } from "@trip-loom/api/dto";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { poll } from "@/lib/poll";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentFormProvider, PaymentForm } from "@/components/payment-form";
import { paymentQueries } from "@/lib/api/react-query/payments";
import { useWizard } from "../wizard-context";

type PayFlightStepProps = {
  flightType: "outbound" | "return";
};

type PaymentStatus =
  | "idle"
  | "creating"
  | "ready"
  | "polling"
  | "succeeded"
  | "failed";

export function PayFlightStep({ flightType }: PayFlightStepProps) {
  const {
    trip,
    outboundFlight,
    returnFlight,
    setOutboundPayment,
    setReturnPayment,
    nextStep,
  } = useWizard();

  const queryClient = useQueryClient();
  const isOutbound = flightType === "outbound";
  const flight = isOutbound ? outboundFlight : returnFlight;

  const [status, setStatus] = React.useState<PaymentStatus>("idle");
  const [paymentId, setPaymentId] = React.useState<string | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const createPaymentMutation = useMutation(
    paymentQueries.createPaymentIntent(),
  );

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleStartPayment = async () => {
    if (!trip || !flight) {
      toast.error("Missing trip or flight data");
      return;
    }

    try {
      setStatus("creating");
      const intentResult = await createPaymentMutation.mutateAsync({
        tripId: trip.id,
        amountInCents: flight.priceInCents,
        currency: "usd",
        description: `${isOutbound ? "Outbound" : "Return"} flight: ${flight.flightNumber}`,
        bookingType: "flight",
        bookingId: flight.id,
      });

      if (intentResult.error || !intentResult.data) {
        throw new Error("Failed to create payment intent");
      }

      const { paymentId: newPaymentId, clientSecret: newClientSecret } =
        intentResult.data;
      setPaymentId(newPaymentId);
      setClientSecret(newClientSecret);
      setStatus("ready");
    } catch (error) {
      console.error("Payment intent error:", error);
      setStatus("failed");
      toast.error("Failed to initialize payment");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentId) {
      setStatus("failed");
      toast.error("Payment ID not found");
      return;
    }

    // Poll for payment confirmation via webhook
    setStatus("polling");
    abortControllerRef.current = new AbortController();

    let finalPayment: PaymentDTO | null = null;

    try {
      await poll({
        createPromise: async () => {
          const result = await queryClient.fetchQuery({
            ...paymentQueries.getPaymentById(paymentId),
            gcTime: 0,
            staleTime: 0,
          });
          return result;
        },
        onSuccess: (result) => {
          if (result.error || !result.data) {
            return true; // Continue polling
          }

          const payment = result.data as PaymentDTO;

          if (payment.status === "succeeded") {
            finalPayment = payment;
            return false; // Stop polling
          }

          if (payment.status === "failed") {
            finalPayment = payment;
            return false; // Stop polling
          }

          return true; // Non-terminal states: continue polling
        },
        onError: (error) => {
          console.error("Polling error:", error);
        },
        interval: 2000,
        maxAttempts: 30,
        abortSignal: abortControllerRef.current.signal,
      });

      if (finalPayment) {
        const payment = finalPayment as PaymentDTO;
        if (payment.status === "succeeded") {
          setStatus("succeeded");
          if (isOutbound) {
            setOutboundPayment(payment);
          } else {
            setReturnPayment(payment);
          }
          toast.success("Payment successful!");
        } else {
          setStatus("failed");
          toast.error("Payment failed");
        }
      } else {
        setStatus("failed");
        toast.error("Payment status unknown. Please check manually.");
      }
    } catch (error) {
      console.error("Polling error:", error);
      setStatus("failed");
      toast.error("Failed to verify payment status");
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    // Don't set failed status here - let user retry in the form
  };

  const handleContinue = () => {
    nextStep();
  };

  const handleReset = () => {
    setStatus("idle");
    setPaymentId(null);
    setClientSecret(null);
  };

  if (!trip || !flight) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Missing flight booking data.
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Pay for {isOutbound ? "Outbound" : "Return"} Flight
        </CardTitle>
        <CardDescription>
          Complete payment for flight {flight.flightNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Flight Summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flight</span>
                <span className="font-medium">{flight.flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span className="font-medium">
                  {flight.departureAirportCode} → {flight.arrivalAirportCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Airline</span>
                <span className="font-medium">{flight.airline}</span>
              </div>
              {flight.seatNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seat</span>
                  <span className="font-medium">{flight.seatNumber}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">
                  {formatPrice(flight.priceInCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment States */}
          {status === "idle" && (
            <Button
              onClick={handleStartPayment}
              className="w-full"
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Spinner />
                  Initializing...
                </>
              ) : (
                `Pay ${formatPrice(flight.priceInCents)}`
              )}
            </Button>
          )}

          {status === "creating" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Spinner className="size-8" />
              <div className="text-center text-muted-foreground">
                Initializing payment...
              </div>
            </div>
          )}

          {status === "ready" && clientSecret && (
            <PaymentFormProvider clientSecret={clientSecret}>
              <PaymentForm
                amountInCents={flight.priceInCents}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </PaymentFormProvider>
          )}

          {status === "polling" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Spinner className="size-8" />
              <div className="text-center text-muted-foreground">
                Confirming payment...
              </div>
            </div>
          )}

          {status === "succeeded" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2Icon className="size-12 text-green-500" />
                <div className="text-center font-medium text-green-600">
                  Payment Successful!
                </div>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Continue to Next Step
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <XCircleIcon className="size-12 text-destructive" />
                <div className="text-center font-medium text-destructive">
                  Payment Failed
                </div>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}

          {paymentId && (
            <div className="text-xs text-muted-foreground text-center">
              Payment ID: {paymentId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
