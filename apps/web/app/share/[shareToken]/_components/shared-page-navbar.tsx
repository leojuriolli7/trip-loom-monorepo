import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function SharedPageNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/backpack.png"
            alt="TripLoom"
            width={32}
            height={32}
            className="drop-shadow-sm"
          />
          <span className="text-lg font-bold tracking-tight">TripLoom</span>
        </Link>

        <Button asChild size="sm" className="rounded-3xl" data-testid="plan-your-trip-cta">
          <Link href="/chat">Plan your own trip</Link>
        </Button>
      </div>
    </nav>
  );
}
