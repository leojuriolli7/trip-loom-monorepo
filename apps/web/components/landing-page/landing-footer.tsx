"use client";

import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative size-8 overflow-hidden rounded-lg">
                <Image
                  src="/logo.png"
                  alt="TripLoom Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                TripLoom
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Weaving your travel dreams into seamless reality, one chat at a
              time.
            </p>
          </div>

          <nav className="flex flex-wrap gap-8">
            <Link
              href="#demo"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it Works
            </Link>
            <Link
              href="/chat"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Chat
            </Link>
            <Link
              href="/enter"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
        </div>

        <div className="mt-10 border-t border-border/30 pt-6 text-center text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} TripLoom. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
