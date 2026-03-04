"use client";

import { useState } from "react";
import { MailIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/api/auth-client";

export function EmailVerificationBanner() {
  const { data: sessionData } = authClient.useSession();
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const user = sessionData?.user;

  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleSendVerification = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      const { error } = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/chat",
      });

      if (error) {
        toast.error(error.message || "Failed to send verification email");
        return;
      }

      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="group relative mx-1 mb-2 flex cursor-pointer items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2.5 ring-1 ring-primary/20 transition-colors hover:bg-primary/15"
      onClick={handleSendVerification}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSendVerification();
        }
      }}
      data-testid="email-verification-banner"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
        <MailIcon className="size-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {isSending ? "Sending email..." : "Verify your email"}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          Click here to verify
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        className="shrink-0 rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label="Dismiss"
        data-testid="dismiss-verification-banner"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
