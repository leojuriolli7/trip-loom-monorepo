"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";
import { tripDetailsSheetAtom } from "@/components/trip-details-sheet";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { tripQueries } from "@/lib/api/react-query/trips";

type DeleteTripButtonProps = {
  tripId: string;
  tripTitle: string;
};

export function DeleteTripButton({ tripId, tripTitle }: DeleteTripButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setTripDetailsSheet = useSetAtom(tripDetailsSheetAtom);
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation(tripQueries.deleteTrip());

  const handleDeleteTrip = async () => {
    try {
      const result = await mutation.mutateAsync({ id: tripId });

      if (result.error) {
        throw new Error("Could not delete trip");
      }

      setTripDetailsSheet((prev) =>
        prev.tripId === tripId ? { tripId: null, isOpen: false } : prev,
      );
      setIsOpen(false);
      toast.success(`Deleted ${tripTitle}`);

      startTransition(() => {
        router.replace("/chat", { scroll: false });
      });

      window.requestAnimationFrame(() => {
        queryClient.removeQueries({ queryKey: tripQueries.base() });
      });
    } catch {
      toast.error("Could not delete this trip. Please try again.");
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) {
          setIsOpen(nextOpen);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full border border-border/60"
          aria-label={`Delete ${tripTitle}`}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/12 text-destructive">
            <Image src="/trash.png" width={64} height={64} alt="Trash can" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this trip permanently?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-left">
            <span className="block">
              This action is permanent. Trip chat history, itinerary details,
              bookings, and local payment records linked to this trip will be
              removed from your workspace.
            </span>
            <span className="block">
              Refunds will not be eligible for payments related to this trip
              after deletion.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Keep trip
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteTrip}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting..." : "Delete trip"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
