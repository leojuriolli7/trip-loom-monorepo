"use client";

import { PenLineIcon, PlaneIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { currentTrips, drafts, pastTrips, upcomingTrips } from "../../_mocks";

type HeaderMeta = {
  title: string;
  subtitle?: string;
  isDraft?: boolean;
};

function getHeaderMeta(pathname: string): HeaderMeta | null {
  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  const chatId = pathname.split("/")[2] ?? "";
  if (!chatId) {
    return null;
  }

  const draft = drafts.find((item) => item.id === chatId);

  if (draft) {
    return {
      title: draft.title,
      subtitle: `Updated ${draft.updatedAt}`,
      isDraft: true,
    };
  }

  // TODO: Will get from react-query cache here
  const trip = [...currentTrips, ...upcomingTrips, ...pastTrips].find(
    (item) => item.id === chatId,
  );

  if (trip) {
    return {
      title: `${trip.destination}, ${trip.country}`,
      subtitle: trip.dates,
    };
  }

  return {
    title: "Trip conversation",
    subtitle: "Mocked conversation details",
  };
}

export function ChatTopbar() {
  const pathname = usePathname();
  const meta = getHeaderMeta(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />

        {meta ? (
          <div className="flex min-w-0 items-center gap-2">
            <div>
              <p className="truncate font-medium">{meta.title}</p>
              {meta.subtitle ? (
                <p className="truncate text-sm text-muted-foreground leading-none">
                  {meta.subtitle}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
