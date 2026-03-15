import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SharedTripNotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
      data-testid="shared-trip-not-found"
    >
      <Image
        src="/luggage.png"
        alt="Lost luggage"
        width={160}
        height={160}
        className="drop-shadow-[0_12px_20px_rgba(0,0,0,0.15)]"
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Trip not found</h1>
        <p className="max-w-md text-muted-foreground">
          This shared trip link is no longer available. The owner may have
          stopped sharing, or the link might be incorrect.
        </p>
      </div>

      <Button asChild className="rounded-3xl">
        <Link href="/chat">Plan your own trip</Link>
      </Button>
    </div>
  );
}
