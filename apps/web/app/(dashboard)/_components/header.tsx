"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { BookCheckIcon, MessageCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const isDevEnv = process.env.NODE_ENV === "development";

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
          {isDevEnv && (
            <Link href="/dev/api-crud">
              <Button variant="outline">
                <BookCheckIcon />

                <span className="sm:inline hidden">API Dev Page</span>
              </Button>
            </Link>
          )}

          <Link href="/chat">
            <Button>
              <MessageCircleIcon className="sm:hidden block" />

              <span className="sm:inline hidden">Plan a Trip</span>
            </Button>
          </Link>

          <ThemeToggle />

          <UserAvatar variant="icon" />
        </div>
      </div>
    </header>
  );
}
