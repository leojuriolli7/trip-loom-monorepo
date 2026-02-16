"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-1">
          <Image src="/logo.png" alt="TripLoom" width={36} height={36} />
          <span className="text-xl font-semibold tracking-tight text-acc">
            TripLoom
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button>Plan a Trip</Button>
          </Link>

          <ThemeToggle />

          <UserAvatar variant="icon" />
        </div>
      </div>
    </header>
  );
}
