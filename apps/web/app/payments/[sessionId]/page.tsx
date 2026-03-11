import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/api-client";
import { PaymentPageClient } from "./payment-page-client";

type PaymentPageProps = {
  params: Promise<{ sessionId: string }>;
};

async function getHostedPaymentSession(sessionId: string) {
  const response = await apiClient.api.payments({ id: sessionId }).session.get({
    fetch: { cache: "no-store" },
  });

  if (response.status === 404) {
    notFound();
  }

  if (response.error) {
    return {
      ok: false as const,
      message:
        typeof response.error.value?.message === "string"
          ? response.error.value.message
          : "Unable to load this payment session.",
    };
  }

  return {
    ok: true as const,
    data: response.data,
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { sessionId } = await params;
  const paymentSession = await getHostedPaymentSession(sessionId);

  if (!paymentSession.ok) {
    return (
      <main className="mx-auto flex justify-center min-h-screen max-w-xl items-center px-6 py-16">
        <p className="text-sm text-muted-foreground">
          {paymentSession.message}
        </p>
      </main>
    );
  }

  if (!paymentSession.data.clientSecret) {
    return (
      <main className="mx-auto flex justify-center min-h-screen max-w-xl items-center px-6 py-16">
        <p className="text-sm text-muted-foreground">
          This payment session is no longer available.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex justify-center min-h-screen w-full max-w-xl items-center px-6 py-16">
      <div className="w-full space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            TripLoom checkout
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Complete your payment
          </h1>
        </div>

        <PaymentPageClient
          amountInCents={paymentSession.data.amountInCents}
          clientSecret={paymentSession.data.clientSecret}
          currency={paymentSession.data.currency}
          sessionId={sessionId}
        />
      </div>
    </main>
  );
}
