"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl"
          : "bg-black/10 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="relative size-9 overflow-hidden rounded-xl">
              <Image
                src="/logo.png"
                alt="TripLoom Logo"
                fill
                className="object-contain"
              />
            </div>
            <span
              className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${
                scrolled ? "text-foreground" : "text-white"
              }`}
            >
              TripLoom
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#demo"
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/70 hover:text-white"
            }`}
          >
            How it Works
          </Link>
          <Link
            href="/chat"
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/70 hover:text-white"
            }`}
          >
            Plan a Trip
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button
            asChild
            size="sm"
            className={`hidden transition-all duration-300 sm:inline-flex ${
              scrolled
                ? ""
                : "bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 hover:text-white"
            }`}
          >
            <Link href="/enter">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
