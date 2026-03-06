"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TripLoomPaymentResume } from "@trip-loom/agents";
import { AlertCircleIcon } from "lucide-react";
import { PaymentFormWithProvider } from "@/components/payment-form";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { usePaymentBooking } from "@/hooks/use-payment-booking";
import { poll } from "@/lib/poll";
import { paymentQueries } from "@/lib/api/react-query/payments";
import { invalidatePaymentConversationQueries } from "@/utils/invalidate-payment-queries";
import {
  formatPaymentAmount,
  getPaymentBookingAmount,
  getPaymentBookingLabel,
  getPaymentBookingSummary,
  getPaymentIntentDescription,
  type PaymentBookingType,
} from "@/utils/payments";
import { ChatActionCard } from "./core/chat-action-card";

type PaymentRequestCardProps = {
  tripId: string;
  bookingType: PaymentBookingType;
  bookingId: string;
  disabled?: boolean;
  onCancel: () => Promise<void>;
  onPaid: (resume: TripLoomPaymentResume) => Promise<void>;
};

type PaymentRequestStatus =
  | "idle"
  | "creating"
  | "ready"
  | "polling"
  | "failed";

type PaymentApiError = {
  code: string | null;
  message: string | null;
  statusCode: number | null;
};

type PaymentFailureState = {
  title: string;
  description: string;
  detail: string | null;
  allowRetry: boolean;
  dismissLabel: string;
};

const NON_RETRYABLE_PAYMENT_ERROR_CODES = new Set([
  "BookingNotPayable",
  "PaymentProcessing",
]);

// Treaty-style client errors wrap the server payload under `value`.
function getApiErrorDetails(error: unknown): PaymentApiError | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    (typeof error.code === "string" || error.code === null) &&
    (typeof error.message === "string" || error.message === null)
  ) {
    return {
      code: error.code,
      message: error.message,
      statusCode:
        "statusCode" in error && typeof error.statusCode === "number"
          ? error.statusCode
          : null,
    };
  }

  if (
    error &&
    typeof error === "object" &&
    "value" in error &&
    error.value &&
    typeof error.value === "object"
  ) {
    const value = error.value as {
      error?: unknown;
      message?: unknown;
      statusCode?: unknown;
    };

    return {
      code: typeof value.error === "string" ? value.error : null,
      message: typeof value.message === "string" ? value.message : null,
      statusCode:
        typeof value.statusCode === "number" ? value.statusCode : null,
    };
  }

  return null;
}

// Payment conflicts that come from booking state should not keep offering a
// retry button, because opening a new checkout would be misleading.
function getPaymentFailureState(
  error: PaymentApiError | null,
): PaymentFailureState {
  if (error?.code === "PaymentAlreadySuccessful") {
    return {
      title: "Payment already completed",
      description:
        error.message ?? "This booking already has a completed payment.",
      detail: null,
      allowRetry: false,
      dismissLabel: "Close",
    };
  }

  if (error?.code && NON_RETRYABLE_PAYMENT_ERROR_CODES.has(error.code)) {
    return {
      title: "Payment is unavailable",
      description:
        error.message ?? "This booking cannot open a new checkout right now.",
      detail: null,
      allowRetry: false,
      dismissLabel: "Close",
    };
  }

  return {
    title: "Payment could not be completed",
    description:
      error?.message ?? "Please try again or close this payment request.",
    detail: "Checkout is still unpaid.",
    allowRetry: true,
    dismissLabel: "Cancel",
  };
}

export function PaymentRequestCard({
  tripId,
  bookingType,
  bookingId,
  disabled,
  onCancel,
  onPaid,
}: PaymentRequestCardProps) {
  const queryClient = useQueryClient();
  const { booking, isError, isPending } = usePaymentBooking({
    tripId,
    bookingType,
    bookingId,
  });
  const createPaymentMutation = useMutation(
    paymentQueries.createPaymentIntent(),
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<PaymentRequestStatus>("idle");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [failure, setFailure] = useState<PaymentFailureState | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function handleCancel() {
    setFailure(null);
    try {
      await onCancel();
    } catch (error) {
      setStatus("failed");
      setFailure(
        getPaymentFailureState({
          code: null,
          message:
            error instanceof Error
              ? error.message
              : "Could not close payment flow",
          statusCode: null,
        }),
      );
    }
  }

  // If checkout has already been completed for this booking, resume from the
  // saved payment instead of keeping the user inside a dead-end payment prompt.
  async function resolveExistingSuccessfulPayment(existingPaymentId: string) {
    setStatus("polling");
    setFailure(null);

    try {
      await invalidatePaymentConversationQueries(queryClient, {
        tripId,
        bookingId,
        bookingType,
        paymentId: existingPaymentId,
      });

      await onPaid({
        status: "paid",
        bookingId,
        bookingType,
        paymentId: existingPaymentId,
      });
    } catch (error) {
      setStatus("failed");
      setFailure(
        getPaymentFailureState({
          code: null,
          message:
            error instanceof Error
              ? error.message
              : "Could not finalize the existing payment",
          statusCode: null,
        }),
      );
    }
  }

  if (isPending) {
    return (
      <ToolCallCard className="border-transparent shadow-none">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/wallet.png" alt="Wallet" />
          <ToolCallCard.HeaderContent>
            <ToolCallCard.Title>Preparing payment</ToolCallCard.Title>
            <ToolCallCard.Description>
              Verifying your booking details before opening checkout
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>
        <ToolCallCard.Content>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading booking details...
          </div>
        </ToolCallCard.Content>
      </ToolCallCard>
    );
  }

  if (isError || !booking) {
    return (
      <ToolCallCard className="border-transparent shadow-none">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/wallet.png" alt="Wallet" />
          <ToolCallCard.HeaderContent>
            <ToolCallCard.Title>Payment unavailable</ToolCallCard.Title>
            <ToolCallCard.Description>
              We could not verify this booking, so checkout cannot be opened.
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>
        <ToolCallCard.Footer>
          <Button
            disabled={disabled}
            onClick={() => {
              void handleCancel();
            }}
            size="sm"
            variant="outline"
          >
            Close
          </Button>
        </ToolCallCard.Footer>
      </ToolCallCard>
    );
  }

  const amountInCents = getPaymentBookingAmount(booking);
  const amountLabel = formatPaymentAmount(amountInCents, "usd");
  const bookingLabel = getPaymentBookingLabel(booking);
  const bookingSummary = getPaymentBookingSummary(booking);

  // Checkout starts only after we re-fetch the booking and ask the server to
  // create or reuse the current valid payment attempt for that booking.
  const handleStartPayment = async () => {
    try {
      setFailure(null);
      setStatus("creating");

      const intentResult = await createPaymentMutation.mutateAsync({
        tripId,
        bookingId,
        bookingType,
        // Bookings do not currently persist currency, so checkout uses the app's
        // existing USD payment flow until booking currency becomes first-class.
        currency: "usd",
        description: getPaymentIntentDescription(booking),
      });

      if (intentResult.error || !intentResult.data) {
        const apiError = getApiErrorDetails(intentResult.error);

        if (
          apiError?.code === "PaymentAlreadySuccessful" &&
          booking.booking.paymentId
        ) {
          await resolveExistingSuccessfulPayment(booking.booking.paymentId);
          return;
        }

        throw (
          apiError ?? {
            code: null,
            message: "Failed to create payment intent",
            statusCode: null,
          }
        );
      }

      setPaymentId(intentResult.data.paymentId);
      setClientSecret(intentResult.data.clientSecret);
      setStatus("ready");
    } catch (error) {
      setStatus("failed");
      setFailure(
        getPaymentFailureState(
          getApiErrorDetails(error) ??
            (error &&
            typeof error === "object" &&
            "message" in error &&
            typeof error.message === "string"
              ? {
                  code: null,
                  message: error.message,
                  statusCode: null,
                }
              : {
                  code: null,
                  message: "Could not initialize payment",
                  statusCode: null,
                }),
        ),
      );
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentId) {
      setStatus("failed");
      setFailure(
        getPaymentFailureState({
          code: null,
          message: "Payment ID not found",
          statusCode: null,
        }),
      );
      return;
    }

    setFailure(null);
    setStatus("polling");
    abortControllerRef.current = new AbortController();

    // Webhooks are authoritative, so after Stripe says "success" we poll the
    // API until the local payment record is finalized before resuming the graph.
    let finalStatus: "succeeded" | "failed" | null = null;
    let failedStatusReads = 0;

    try {
      await poll({
        createPromise: async () =>
          queryClient.fetchQuery({
            ...paymentQueries.getPaymentById(paymentId),
            gcTime: 0,
            staleTime: 0,
          }),
        onSuccess: (result) => {
          if (result.error || !result.data) {
            return true;
          }

          if (result.data.status === "succeeded") {
            finalStatus = "succeeded";
            return false;
          }

          if (result.data.status === "failed") {
            failedStatusReads += 1;

            // A previous declined attempt on the same intent can briefly leave
            // local state behind the final successful webhook.
            if (failedStatusReads < 3) {
              return true;
            }

            finalStatus = "failed";
            return false;
          }

          failedStatusReads = 0;
          return true;
        },
        interval: 2000,
        maxAttempts: 30,
        abortSignal: abortControllerRef.current.signal,
      });

      if (finalStatus !== "succeeded") {
        setStatus("failed");
        setFailure(
          getPaymentFailureState({
            code: null,
            message: "Payment was not completed",
            statusCode: null,
          }),
        );
        return;
      }

      await invalidatePaymentConversationQueries(queryClient, {
        tripId,
        bookingId,
        bookingType,
        paymentId,
      });

      await onPaid({
        status: "paid",
        bookingId,
        bookingType,
        paymentId,
      });
    } catch (error) {
      setStatus("failed");
      setFailure(
        getPaymentFailureState({
          code: null,
          message:
            error instanceof Error
              ? error.message
              : "Could not verify payment status",
          statusCode: null,
        }),
      );
    }
  };

  if (status === "idle") {
    return (
      <ChatActionCard
        cancelDisabled={disabled}
        confirmDisabled={disabled || createPaymentMutation.isPending}
        confirmLabel={`Pay ${amountLabel}`}
        cancelLabel="Cancel"
        description={`We verified ${bookingSummary}. Checkout will use the saved booking total of ${amountLabel}.`}
        imageAlt="Wallet"
        imageSrc="/wallet.png"
        onCancel={() => {
          void handleCancel();
        }}
        onConfirm={() => {
          void handleStartPayment();
        }}
        title="Payment required"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{bookingType}</Badge>
          <Badge variant="outline">{bookingLabel}</Badge>
        </div>
      </ChatActionCard>
    );
  }

  if (status === "creating" || status === "polling") {
    return (
      <ToolCallCard className="border-transparent shadow-none">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/wallet.png" alt="Wallet" />
          <ToolCallCard.HeaderContent>
            <ToolCallCard.Title>
              {status === "creating"
                ? "Opening checkout"
                : "Confirming payment"}
            </ToolCallCard.Title>
            <ToolCallCard.Description>
              {status === "creating"
                ? `Preparing secure checkout for ${bookingLabel}`
                : "Waiting for the payment provider to confirm the transaction"}
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>

        <ToolCallCard.Content>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            {status === "creating"
              ? "Initializing payment..."
              : "Confirming payment..."}
          </div>
        </ToolCallCard.Content>
      </ToolCallCard>
    );
  }

  if (status === "failed") {
    return (
      <ToolCallCard className="border-transparent shadow-none">
        <ToolCallCard.Header>
          <ToolCallCard.Image src="/wallet.png" alt="Wallet" />
          <ToolCallCard.HeaderContent>
            <ToolCallCard.Title>
              {failure?.title ?? "Payment could not be completed"}
            </ToolCallCard.Title>
            <ToolCallCard.Description className="first-letter:normal">
              {failure?.description ??
                "Please try again or close this payment request."}
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </ToolCallCard.Header>

        {failure?.detail ? (
          <ToolCallCard.Content>
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircleIcon className="size-4" />
              Checkout for {bookingLabel} {failure.detail.toLowerCase()}
            </div>
          </ToolCallCard.Content>
        ) : null}

        <ToolCallCard.Footer>
          {failure?.allowRetry ? (
            <Button
              disabled={disabled}
              onClick={() => {
                setStatus("idle");
                setFailure(null);
              }}
              size="sm"
            >
              Try again
            </Button>
          ) : null}
          <Button
            disabled={disabled}
            onClick={() => {
              void handleCancel();
            }}
            size="sm"
            variant="outline"
          >
            {failure?.dismissLabel ?? "Cancel"}
          </Button>
        </ToolCallCard.Footer>
      </ToolCallCard>
    );
  }

  return (
    <ToolCallCard className="border-transparent shadow-none">
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/wallet.png" alt="Wallet" />
        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>Complete your payment</ToolCallCard.Title>
          <ToolCallCard.Description>
            {`Checkout is ready for ${bookingLabel}. The verified total is ${amountLabel}.`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      <ToolCallCard.Content className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {bookingType}
          </Badge>
          <Badge variant="outline">{amountLabel}</Badge>
        </div>

        {clientSecret ? (
          <PaymentFormWithProvider
            amountInCents={amountInCents}
            clientSecret={clientSecret}
            onSuccess={() => {
              void handlePaymentSuccess();
            }}
          />
        ) : null}
      </ToolCallCard.Content>

      <ToolCallCard.Footer>
        <Button
          disabled={disabled}
          onClick={() => {
            void handleCancel();
          }}
          size="sm"
          variant="outline"
        >
          Cancel
        </Button>
      </ToolCallCard.Footer>
    </ToolCallCard>
  );
}
