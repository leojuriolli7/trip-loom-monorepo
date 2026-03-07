"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Check, X, KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { Suspense } from "react";
import Image from "next/image";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { authClient } from "@/lib/api/auth-client";
import { Spinner } from "@/components/ui/spinner";
import {
  passwordRequirements,
  validateLength,
  validateNumber,
  validateSpecialCharacter,
} from "@/lib/password-validation";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .refine(validateLength, "Password must be at least 8 characters")
      .refine(validateNumber, "Password must contain at least 1 number")
      .refine(
        validateSpecialCharacter,
        "Password must contain at least 1 special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {passwordRequirements.map((req) => {
        const isValid = req.validate(password);
        return (
          <li
            key={req.label}
            className={`flex items-center gap-2 ${
              isValid ? "text-green-600" : "text-red-500"
            }`}
          >
            {isValid ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}

function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordFormData>({
    resolver: standardSchemaResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const isLoading = form.formState.isSubmitting;
  const passwordValue = form.watch("password");

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) return;

    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        toast.error(
          error.message ||
            "Failed to reset password. The link may have expired.",
        );
        return;
      }

      toast.success("Password updated! Please sign in with your new password.");
      router.push("/enter");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
            <X className="size-8 text-destructive" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            Invalid reset link
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Button onClick={() => router.push("/enter")} className="w-full">
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="TripLoom"
            width={32}
            height={32}
            className="mb-4"
          />
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRoundIcon className="size-8 text-primary" />
          </div>
          <h2
            className="mb-2 text-2xl font-bold tracking-tight"
            data-testid="reset-password-title"
          >
            Set a new password
          </h2>
          <p className="text-muted-foreground">
            Choose a strong password for your account
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          data-testid="reset-password-form"
        >
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    disabled={isLoading}
                    data-testid="reset-password-input"
                  />
                  <PasswordRequirements password={passwordValue} />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Confirm new password
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    disabled={isLoading}
                    data-testid="reset-confirm-password-input"
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="reset-password-submit"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </FieldGroup>
        </form>

        <p className="text-muted-foreground mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => router.push("/enter")}
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 transition-colors hover:underline"
          >
            Back to login
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordPage />
    </Suspense>
  );
}
