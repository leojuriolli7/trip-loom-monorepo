"use client";

import * as React from "react";
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
  type Appearance,
} from "@stripe/stripe-js";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatPriceInCents } from "@/lib/format-price-in-cents";

// Initialize Stripe once
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// Custom appearance to match the app's design system
function getAppearance(isDark: boolean): Appearance {
  return {
    theme: isDark ? "night" : "stripe",
    variables: {
      // Colors
      colorPrimary: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
      colorBackground: isDark
        ? "oklch(0.24 0.012 58)"
        : "oklch(0.997 0.004 80)",
      colorText: isDark ? "oklch(0.94 0.01 80)" : "oklch(0.22 0.02 55)",
      colorTextSecondary: isDark
        ? "oklch(0.77 0.015 72)"
        : "oklch(0.5 0.02 55)",
      colorTextPlaceholder: isDark
        ? "oklch(0.77 0.015 72)"
        : "oklch(0.5 0.02 55)",
      colorDanger: isDark
        ? "oklch(0.704 0.191 22.216)"
        : "oklch(0.577 0.245 27.325)",
      colorSuccess: "#22c55e",
      colorWarning: "#f59e0b",

      // Borders
      colorIconCardError: isDark
        ? "oklch(0.704 0.191 22.216)"
        : "oklch(0.577 0.245 27.325)",

      // Typography
      fontFamily: "Figtree, system-ui, sans-serif",
      fontSizeBase: "14px",
      fontWeightNormal: "400",
      fontWeightMedium: "500",
      fontWeightBold: "600",

      // Spacing & Sizing
      spacingUnit: "4px",
      borderRadius: "9999px", // Matches rounded-4xl for pill-shaped inputs

      // Focus
      focusBoxShadow: isDark
        ? "0 0 0 3px oklch(0.79 0.15 72 / 0.5)"
        : "0 0 0 3px oklch(0.65 0.12 55 / 0.5)",
      focusOutline: "none",
    },
    rules: {
      ".Input": {
        backgroundColor: isDark
          ? "oklch(0.3 0.012 58 / 0.3)"
          : "oklch(0.92 0.015 65 / 0.3)",
        border: isDark
          ? "1px solid oklch(0.4 0.015 58)"
          : "1px solid oklch(0.92 0.015 65)",
        borderRadius: "9999px",
        padding: "10px 14px",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      },
      ".Input:focus": {
        borderColor: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.12 55)",
        boxShadow: isDark
          ? "0 0 0 3px oklch(0.79 0.15 72 / 0.5)"
          : "0 0 0 3px oklch(0.65 0.12 55 / 0.5)",
      },
      ".Input--invalid": {
        borderColor: isDark
          ? "oklch(0.704 0.191 22.216 / 0.5)"
          : "oklch(0.577 0.245 27.325)",
        boxShadow: isDark
          ? "0 0 0 3px oklch(0.704 0.191 22.216 / 0.4)"
          : "0 0 0 3px oklch(0.577 0.245 27.325 / 0.2)",
      },
      ".Label": {
        fontSize: "14px",
        fontWeight: "500",
        marginBottom: "6px",
        color: isDark ? "oklch(0.94 0.01 80)" : "oklch(0.22 0.02 55)",
      },
      ".Error": {
        fontSize: "13px",
        marginTop: "6px",
        color: isDark
          ? "oklch(0.704 0.191 22.216)"
          : "oklch(0.577 0.245 27.325)",
      },
      ".Tab": {
        borderRadius: "9999px",
        border: isDark
          ? "1px solid oklch(0.4 0.015 58)"
          : "1px solid oklch(0.92 0.015 65)",
        backgroundColor: isDark
          ? "oklch(0.3 0.012 58 / 0.3)"
          : "oklch(0.92 0.015 65 / 0.3)",
      },
      ".Tab:hover": {
        borderColor: isDark ? "oklch(0.5 0.015 58)" : "oklch(0.85 0.015 65)",
      },
      ".Tab--selected": {
        borderColor: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
        backgroundColor: isDark
          ? "oklch(0.79 0.15 72 / 0.1)"
          : "oklch(0.65 0.165 55 / 0.1)",
      },
      ".TabIcon--selected": {
        fill: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
      },
      ".TabLabel--selected": {
        color: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
      },
    },
  };
}

type PaymentFormProps = {
  /** Amount in cents to display */
  amountInCents: number;
  /** Currency code (default: "usd") */
  currency?: string;
  /** Called when payment is successful */
  onSuccess: () => void;
  /** Called when payment fails */
  onError?: (error: string) => void;
  /** Submit button text (default: "Pay {amount}") */
  submitText?: string;
  /** Additional class for the form container */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
};

function PaymentFormInner({
  amountInCents,
  currency = "usd",
  onSuccess,
  onError,
  submitText,
  className,
  disabled,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);
  // The form owns the visible checkout error state while the parent card owns
  // higher-level lifecycle errors such as create-intent or webhook polling.
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

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
      } else {
        // Payment succeeded
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isReady = stripe && elements;
  const buttonText =
    submitText ?? `Pay ${formatPriceInCents(amountInCents, currency)}`;

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
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

      <Button
        type="submit"
        className="w-full"
        disabled={!isReady || isProcessing || disabled}
      >
        {isProcessing ? (
          <>
            <Spinner />
            Processing...
          </>
        ) : !isReady ? (
          <>
            <Spinner />
            Loading...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
}

type PaymentFormProviderProps = {
  /** The client secret from the payment intent */
  clientSecret: string;
  /** Children to render (typically PaymentForm) */
  children: React.ReactNode;
};

export function PaymentFormProvider({
  clientSecret,
  children,
}: PaymentFormProviderProps) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    // Check for dark mode
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDark();

    // Watch for theme changes
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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
      {children}
    </Elements>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return <PaymentFormInner {...props} />;
}

// Combined component for convenience
type PaymentFormWithProviderProps = PaymentFormProps & {
  clientSecret: string;
};

export function PaymentFormWithProvider({
  clientSecret,
  ...formProps
}: PaymentFormWithProviderProps) {
  return (
    <PaymentFormProvider clientSecret={clientSecret}>
      <PaymentForm {...formProps} />
    </PaymentFormProvider>
  );
}
