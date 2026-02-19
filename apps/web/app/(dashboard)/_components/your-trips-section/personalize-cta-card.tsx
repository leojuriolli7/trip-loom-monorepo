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
      <div className="group relative flex h-full min-h-50 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-linear-to-br from-muted/40 via-muted/20 to-transparent p-6 transition-all duration-300 hover:border-primary/40 hover:from-muted/60 hover:via-muted/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="relative transition-transform duration-300 group-hover:scale-120 scale-110">
          <Image
            src={"/travel-items.png"}
            alt="A old-school, grey camera"
            width={160}
            height={160}
            className="h-40 w-40 drop-shadow-md"
          />
        </div>

        <div className="text-center">
          <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
            Personalize your trips
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your travel preferences for tailored recommendations
          </p>
        </div>

        <div className="absolute inset-0 rounded-xl bg-linear-to-t from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    </button>
  );
}
