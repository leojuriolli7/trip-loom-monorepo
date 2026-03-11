"use client";

import { PaymentForm } from "@/components/payment-form";

type PaymentPageClientProps = {
  amountInCents: number;
  clientSecret: string;
  currency: string;
  sessionId: string;
};

export function PaymentPageClient({
  amountInCents,
  clientSecret,
  currency,
  sessionId,
}: PaymentPageClientProps) {
  return (
    <PaymentForm
      amountInCents={amountInCents}
      clientSecret={clientSecret}
      currency={currency}
      paymentId={sessionId}
      onSuccess={() => {
        window.location.reload();
      }}
    />
  );
}
