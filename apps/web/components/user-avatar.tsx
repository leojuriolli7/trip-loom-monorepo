"use client";

import * as React from "react";
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
import { UserPreferencesDialog } from "@/components/user-preferences-dialog";
import { authClient } from "@/lib/api/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon, MapIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type UserAvatarProps = {
  /**
   * "icon" - Just the avatar button
   * "full" - Avatar with name and email beside it
   */
  variant?: "icon" | "full";
};

export function UserAvatar({ variant = "icon" }: UserAvatarProps) {
  const [preferencesOpen, setPreferencesOpen] = React.useState(false);
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  const queryClient = useQueryClient();
  const { user } = sessionData || {};
  const router = useRouter();

  const handleSignOut = () => {
    authClient
      .signOut()
      .then(() => {
        router.refresh();
        queryClient.removeQueries();
      })
      .catch((err) => {
        toast.error(
          "Error logging you out! Please try again or contact support",
        );

        console.error("Error on logout:", err);
      });
  };

  const avatarContent = (
    <Avatar className={variant === "icon" ? "size-9" : "size-8"}>
      {isSessionPending ? (
        <Spinner className="mx-auto my-auto" />
      ) : (
        <>
          <AvatarImage src={user?.image as string} alt={user?.name} />
          <AvatarFallback className="bg-primary/10 font-medium text-primary">
            {user?.name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full ring-2 ring-border/50 ring-offset-2 ring-offset-background transition-all hover:ring-primary/30"
            data-testid="user-avatar-trigger"
          >
            {avatarContent}
          </Button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:opacity-80"
            data-testid="user-avatar-trigger"
          >
            {avatarContent}
            <div className="flex flex-1 flex-col overflow-hidden">
              <span
                className="truncate text-sm font-medium"
                data-testid="user-name"
              >
                {user?.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align={variant === "icon" ? "end" : "start"}
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p
              className="text-sm font-medium leading-none"
              data-testid="dropdown-user-name"
            >
              {user?.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setPreferencesOpen(true)}
            data-testid="preferences-menu-item"
          >
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MapIcon />
            My Trips
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          variant="destructive"
          data-testid="logout-button"
        >
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>

      <UserPreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </DropdownMenu>
  );
}
