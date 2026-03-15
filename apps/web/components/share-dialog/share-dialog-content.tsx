"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckIcon, CopyIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { sharingQueries } from "@/lib/api/react-query/sharing";

type ShareDialogContentProps = {
  tripId: string;
  onClose: () => void;
};

function CopyableLink({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-border/60 bg-muted/40 px-3.5 py-2.5">
        <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
        <p
          className="min-w-0 flex-1 truncate text-sm text-foreground"
          data-testid="share-url-text"
        >
          {shareUrl}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 rounded-xl"
        onClick={handleCopy}
        data-testid="copy-share-link-button"
      >
        {copied ? (
          <CheckIcon className="size-4 text-green-600" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}

export function ShareDialogContent({ tripId, onClose }: ShareDialogContentProps) {
  const queryClient = useQueryClient();
  const { data: statusResult, isPending, isError } = useQuery(
    sharingQueries.getShareStatus(tripId),
  );

  const enableMutation = useMutation(sharingQueries.enableSharing());
  const disableMutation = useMutation(sharingQueries.disableSharing());

  const shareToken = statusResult?.data?.shareToken ?? null;
  const isShared = Boolean(shareToken);

  const handleEnableSharing = () => {
    enableMutation.mutateAsync({ tripId }).then(async (result) => {
      if (result.error) {
        throw new Error("Could not enable sharing");
      }

      await queryClient.invalidateQueries({
        queryKey: sharingQueries.shareStatusKey(tripId),
      });

      toast.success("Sharing enabled. Copy the link to share your trip");
    }).catch(() => {
      toast.error("Could not enable sharing. Please try again");
    });
  };

  const handleDisableSharing = () => {
    disableMutation.mutateAsync({ tripId }).then(async () => {
      await queryClient.invalidateQueries({
        queryKey: sharingQueries.shareStatusKey(tripId),
      });

      toast.success("Sharing disabled. The link no longer works");
      onClose();
    }).catch(() => {
      toast.error("Could not disable sharing. Please try again");
    });
  };

  if (isPending) {
    return (
      <div
        className="flex min-h-52 items-center justify-center"
        data-testid="share-dialog-loading"
      >
        <Spinner className="size-7" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-center">
        <p className="text-destructive">Failed to load sharing status</p>
        <p className="text-sm text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Image
            src="/camera.png"
            alt="3D camera icon"
            width={96}
            height={96}
            className="h-24 w-24 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]"
          />
        </div>

        <div className="space-y-1.5 pt-2">
          <h3 className="text-lg font-semibold tracking-tight">
            {isShared ? "Trip is shared" : "Share this trip"}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isShared
              ? "Anyone with this link can view your trip details, bookings, and itinerary"
              : "Anyone with the link can view this trip's conversation, bookings, and itinerary — read-only, no account needed"}
          </p>
        </div>
      </div>

      {isShared ? (
        <div className="space-y-4">
          <CopyableLink
            shareUrl={`${window.location.origin}/share/${shareToken}`}
          />

          <Button
            type="button"
            variant="destructive"
            className="h-10 w-full rounded-3xl"
            onClick={handleDisableSharing}
            disabled={disableMutation.isPending}
            data-testid="stop-sharing-button"
          >
            {disableMutation.isPending ? (
              <>
                <Spinner />
                Stopping...
              </>
            ) : (
              "Stop Sharing"
            )}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="h-10 w-full rounded-3xl shadow-[0_20px_30px_-24px_rgba(208,115,48,0.7)]"
          onClick={handleEnableSharing}
          disabled={enableMutation.isPending}
          data-testid="start-sharing-button"
        >
          {enableMutation.isPending ? (
            <>
              <Spinner />
              Enabling...
            </>
          ) : (
            "Start Sharing"
          )}
        </Button>
      )}
    </div>
  );
}
