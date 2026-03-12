"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/api/auth-client";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { useInterval } from "@/hooks/use-interval";

type VerifyEmailFormProps = {
  email: string;
};

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useInterval(
    () => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    },
    cooldown > 0 ? 1000 : null,
  );

  const handleResend = async () => {
    if (isResending || cooldown > 0) return;

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
      setCooldown(60);
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
      <div className="mb-5 flex items-center justify-center rounded-2xl">
        <Image
          src="/mail.png"
          alt="Mail envelope"
          width={164}
          height={164}
          className="drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]"
        />
      </div>

      <h2 className="mb-2 text-2xl font-bold tracking-tight">
        Check your email
      </h2>
      <p className="text-muted-foreground">We sent a verification link to</p>
      <p className="mb-6 font-medium text-foreground">{email}</p>

      <div className="flex w-full flex-col gap-3 mt-6">
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
          ) : cooldown > 0 ? (
            `Resend email in ${cooldown}s`
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
