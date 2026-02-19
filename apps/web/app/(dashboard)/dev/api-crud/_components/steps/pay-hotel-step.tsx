"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { Ratings } from "@/components/ui/rating";

type PaymentStatus =
  | "idle"
  | "creating"
  | "ready"
  | "polling"
  | "succeeded"
  | "failed";

export function PayHotelStep() {
  const { trip, hotelBooking, setHotelPayment, nextStep } = useWizard();

  const queryClient = useQueryClient();

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
    if (!trip || !hotelBooking) {
      toast.error("Missing trip or hotel booking data");
      return;
    }

    try {
      setStatus("creating");
      const intentResult = await createPaymentMutation.mutateAsync({
        tripId: trip.id,
        amountInCents: hotelBooking.totalPriceInCents,
        currency: "usd",
        description: `Hotel: ${hotelBooking.hotel.name} (${hotelBooking.numberOfNights} nights)`,
        bookingType: "hotel",
        bookingId: hotelBooking.id,
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
          setHotelPayment(payment);
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

  if (!trip || !hotelBooking) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Missing hotel booking data.
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
        <CardTitle>Pay for Hotel</CardTitle>
        <CardDescription>
          Complete payment for your hotel booking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Hotel Summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-4">
              {hotelBooking.hotel.imageUrl && (
                <img
                  src={hotelBooking.hotel.imageUrl}
                  alt={hotelBooking.hotel.name}
                  className="size-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{hotelBooking.hotel.name}</span>
                  {hotelBooking.hotel.rating && (
                    <Ratings rating={hotelBooking.hotel.rating} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hotelBooking.roomType}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">
                  {format(new Date(hotelBooking.checkInDate), "PPP")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span className="font-medium">
                  {format(new Date(hotelBooking.checkOutDate), "PPP")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nights</span>
                <span className="font-medium">
                  {hotelBooking.numberOfNights}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per night</span>
                <span className="font-medium">
                  {formatPrice(hotelBooking.pricePerNightInCents)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">
                  {formatPrice(hotelBooking.totalPriceInCents)}
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
                `Pay ${formatPrice(hotelBooking.totalPriceInCents)}`
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
                amountInCents={hotelBooking.totalPriceInCents}
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
