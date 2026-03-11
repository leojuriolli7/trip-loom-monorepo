"use client";

import { PaymentFormWithProvider } from "@/components/payment-form";

type PaymentPageClientProps = {
  amountInCents: number;
  clientSecret: string;
  currency: string;
};

export function PaymentPageClient({
  amountInCents,
  clientSecret,
  currency,
}: PaymentPageClientProps) {
  return (
    <PaymentFormWithProvider
      amountInCents={amountInCents}
      clientSecret={clientSecret}
      currency={currency}
      onSuccess={() => {
        window.location.reload();
      }}
    />
  );
}
