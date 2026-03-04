"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/api/auth-client";
import { Spinner } from "@/components/ui/spinner";

type VerifyEmailFormProps = {
  email: string;
};

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);

    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/chat",
      });

      if (error) {
        toast.error(error.message || "Failed to resend email");
        return;
      }

      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleDoLater = () => {
    router.push("/chat");
    router.refresh();
  };

  return (
    <div
      className="flex flex-col items-center text-center"
      data-testid="verify-email-screen"
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <MailIcon className="size-8 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold tracking-tight">
        Check your email
      </h2>
      <p className="text-muted-foreground">We sent a verification link to</p>
      <p className="mb-6 font-medium text-foreground">{email}</p>

      <p className="mb-6 text-sm text-muted-foreground">
        Click the link in the email to verify your account. If you don&apos;t
        see it, check your spam folder.
      </p>

      <div className="flex w-full flex-col gap-3">
        <Button
          onClick={handleResend}
          variant="outline"
          className="w-full"
          disabled={isResending}
          data-testid="resend-verification-email"
        >
          {isResending ? (
            <>
              <Spinner />
              Sending...
            </>
          ) : (
            "Resend email"
          )}
        </Button>

        <Button
          onClick={handleDoLater}
          variant="ghost"
          className="w-full text-muted-foreground"
          data-testid="verify-email-do-later"
        >
          Do later
        </Button>
      </div>
    </div>
  );
}
