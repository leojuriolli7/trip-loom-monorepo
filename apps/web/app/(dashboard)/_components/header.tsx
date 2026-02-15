"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/api/auth";
import { LogOutIcon, MapIcon, SettingsIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header() {
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  const { user } = sessionData || {};

  const router = useRouter();
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

          {/*
            TODO: Create user-avatar.tsx component for re-using this in chat page.
            */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full ring-2 ring-border/50 ring-offset-2 ring-offset-background transition-all hover:ring-primary/30"
              >
                <Avatar className="size-9">
                  {isSessionPending ? (
                    <Spinner className="mx-auto my-auto" />
                  ) : (
                    <>
                      <AvatarImage
                        src={user?.image as string}
                        alt={user?.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user?.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserIcon />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MapIcon />
                  My Trips
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  authClient.signOut();

                  // TODO: Should be able to just re-call the layout.tsx code,
                  // and have it work as the redirect... router.refresh() didn't work.
                  router.replace("/enter");
                }}
                variant="destructive"
              >
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
