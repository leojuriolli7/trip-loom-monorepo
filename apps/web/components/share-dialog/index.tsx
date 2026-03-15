"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { atom, useAtom } from "jotai";
import { ShareDialogContent } from "./share-dialog-content";

type ShareDialogAtom = {
  tripId: string | null;
  isOpen: boolean;
};

export const shareDialogAtom = atom<ShareDialogAtom>({
  tripId: null,
  isOpen: false,
});

export function ShareDialog() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [dialogState, setDialogState] = useAtom(shareDialogAtom);

  const onOpenChange = (val: boolean) => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: val,
    }));
  };

  const onClose = () => {
    setDialogState({ tripId: null, isOpen: false });
  };

  if (isDesktop === undefined || !dialogState.tripId) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog open={dialogState.isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[90dvh] overflow-hidden p-0 sm:max-w-lg"
          data-testid="share-dialog"
        >
          <div className="px-5 pt-5 pb-6 sm:px-6">
            <DialogHeader className="sr-only">
              <DialogTitle>Share Trip</DialogTitle>
              <DialogDescription>
                Share a read-only link to this trip
              </DialogDescription>
            </DialogHeader>

            <ShareDialogContent tripId={dialogState.tripId} onClose={onClose} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={dialogState.isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="p-0" data-testid="share-drawer">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Share Trip</DrawerTitle>
          <DrawerDescription>
            Share a read-only link to this trip
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pt-4 pb-2">
          <ShareDialogContent tripId={dialogState.tripId} onClose={onClose} />
        </div>

        <DrawerFooter className="pt-3" />
      </DrawerContent>
    </Drawer>
  );
}
