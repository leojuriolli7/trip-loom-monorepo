"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { MailCheckIcon } from "lucide-react";

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

const forgotPasswordSchema = z.object({
  email: z.email("Invalid e-mail address").min(1, "Email is required"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type ForgotPasswordFormProps = {
  onBackToLogin: () => void;
};

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: standardSchemaResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/forgot-password",
      });

      // Always show success to prevent email enumeration
      setEmailSent(true);
    } catch {
      setEmailSent(true);
    }
  }

  if (emailSent) {
    return (
      <div
        className="flex flex-col items-center text-center"
        data-testid="forgot-password-email-sent"
      >
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <MailCheckIcon className="size-8 text-primary" />
        </div>

        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          Check your email
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          If an account exists with that email, we sent a link to reset your
          password. The link expires in 1 hour.
        </p>

        <Button
          onClick={onBackToLogin}
          variant="outline"
          className="w-full"
          data-testid="back-to-login"
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      data-testid="forgot-password-form"
    >
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
                disabled={isLoading}
                data-testid="forgot-password-email-input"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          data-testid="forgot-password-submit"
        >
          {isLoading ? (
            <>
              <Spinner />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
