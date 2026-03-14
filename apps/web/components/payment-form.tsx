"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { paymentQueries } from "@/lib/api/react-query/payments";
import { formatPriceInCents } from "@/lib/format-price-in-cents";
import { poll } from "@/lib/poll";
import { useTheme } from "next-themes";
import { getAppearance } from "@/lib/stripe-appearance";

// Initialize Stripe once
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!key) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key, {
      developerTools: {
        assistant: { enabled: false },
      },
    });
  }

  return stripePromise;
}

type PaymentFormInnerProps = {
  /** Payment session id used to confirm completion */
  paymentId: string;
  /** Amount in cents to display */
  amountInCents: number;
  /** Currency code (default: "usd") */
  currency?: string;
  /** Called when payment is successful */
  onSuccess: () => void | Promise<void>;
  /** Called when payment fails */
  onError?: (error: string) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Optional cancel action rendered beside the pay button */
  onCancel?: () => void;
};

function PaymentFormInner({
  paymentId,
  amountInCents,
  currency = "usd",
  onSuccess,
  onError,
  disabled,
  onCancel,
}: PaymentFormInnerProps) {
  const queryClient = useQueryClient();
  const stripe = useStripe();
  const elements = useElements();
  const pollAbortControllerRef = React.useRef<AbortController | null>(null);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(
    () => () => {
      pollAbortControllerRef.current?.abort();
    },
    [],
  );

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    pollAbortControllerRef.current?.abort();
    const pollAbortController = new AbortController();
    pollAbortControllerRef.current = pollAbortController;

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message ?? "Payment failed");
        onError?.(error.message ?? "Payment failed");
      }

      if (!error) {
        let isConfirmed = false;

        await poll({
          createPromise: async () =>
            queryClient.fetchQuery({
              ...paymentQueries.getPaymentById(paymentId),
              gcTime: 0,
              staleTime: 0,
            }),
          onSuccess: (result) => {
            const hasSucceeded = result.data?.status === "succeeded";

            if (hasSucceeded) {
              isConfirmed = true;
            }

            return !hasSucceeded;
          },
          interval: 1500,
          maxAttempts: 20,
          abortSignal: pollAbortController.signal,
        });

        if (!isConfirmed) {
          throw new Error("Payment confirmation timed out");
        }

        await onSuccess();
      }
    } catch (err) {
      if (pollAbortController.signal.aborted) {
        return;
      }

      const message = err instanceof Error ? err.message : "Payment failed";
      setErrorMessage(message);
      onError?.(message);
    } finally {
      if (pollAbortControllerRef.current === pollAbortController) {
        pollAbortControllerRef.current = null;
      }

      setIsProcessing(false);
    }
  };

  const isReady = stripe && elements;

  return (
    <form onSubmit={handleSubmit} className={"space-y-4"}>
      <div className="rounded-xl border border-border bg-card p-4">
        <PaymentElement
          onLoadError={(event) => {
            // Surface Element bootstrap failures in the same place as submit
            // failures so the user only sees one checkout-level error message.
            const message =
              event.error.message ?? "Payment form could not be loaded";
            setErrorMessage(message);
            onError?.(message);
          }}
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-3">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="shrink-0 min-w-4/12"
            onClick={onCancel}
            disabled={isProcessing || disabled}
          >
            {"Cancel"}
          </Button>
        ) : null}

        <Button
          type="submit"
          className="flex-1 w-auto"
          disabled={!isReady || isProcessing || disabled}
        >
          {isProcessing || !isReady ? (
            <>
              <Spinner />

              {isProcessing ? "Processing..." : "Loading..."}
            </>
          ) : (
            `Pay ${formatPriceInCents(amountInCents, currency)}`
          )}
        </Button>
      </div>
    </form>
  );
}

type PaymentFormProps = PaymentFormInnerProps & {
  /** The client secret from the payment intent */
  clientSecret: string;
};

export function PaymentForm({ clientSecret, ...formProps }: PaymentFormProps) {
  const { resolvedTheme: theme } = useTheme();
  const isDark = theme === "dark";

  const options: StripeElementsOptions = React.useMemo(
    () => ({
      clientSecret,
      appearance: getAppearance(isDark),
      fonts: [
        {
          cssSrc:
            "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&display=swap",
        },
      ],
    }),
    [clientSecret, isDark],
  );

  return (
    <Elements stripe={getStripe()} options={options}>
      <PaymentFormInner {...formProps} />
    </Elements>
  );
}
