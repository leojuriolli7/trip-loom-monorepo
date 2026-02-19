"use client";

import Image from "next/image";
import { useSetAtom } from "jotai";
import { userPreferencesDialogOpenAtom } from "@/components/user-preferences-dialog";

export function PersonalizeCtaCard() {
  const setOpenUserPreferencesDialog = useSetAtom(
    userPreferencesDialogOpenAtom,
  );

  return (
    <button
      type="button"
      onClick={() => {
        setOpenUserPreferencesDialog(true);
      }}
      className="cursor-pointer text-left h-full"
    >
      <div className="group relative flex h-full min-h-50 flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/8 via-card to-chart-2/10 p-6 shadow-[0_18px_30px_-28px_rgba(15,23,42,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_28px_40px_-24px_rgba(208,115,48,0.38)]">
        <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-primary/16 blur-3xl transition-opacity duration-300 group-hover:opacity-90" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 size-40 rounded-full bg-chart-2/20 blur-3xl" />

        <div className="relative rounded-2xl transition-transform duration-300 group-hover:scale-105">
          <Image
            src={"/travel-items.png"}
            alt="Stack of travel items, such as glasses, itinerary and passport."
            width={160}
            height={160}
            className="h-36 w-36 drop-shadow-[0_18px_18px_rgba(49,32,10,0.35)]"
          />
        </div>

        <div className="relative text-center">
          <h3 className="font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
            Personalize your trips
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your travel preferences for tailored recommendations
          </p>
        </div>
      </div>
    </button>
  );
}
