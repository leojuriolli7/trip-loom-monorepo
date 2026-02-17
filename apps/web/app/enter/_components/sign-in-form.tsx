"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { toast } from "sonner";

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
import { useQueryClient } from "@tanstack/react-query";
import { userPreferencesQueries } from "@/lib/api/react-query/user-preferences";

const signInSchema = z.object({
  email: z.email("Invalid e-mail address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();

  const form = useForm<SignInFormData>({
    resolver: standardSchemaResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const queryClient = useQueryClient();

  async function onSubmit(data: SignInFormData) {
    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials");
        return;
      }

      /**
       * Optimization: Prefetch the data the user might need as soon as they login.
       * For example: immediately prefetch user preferences.
       * Later on, we can prefetch more stuff, like past trips and top trips.
       */
      void queryClient.prefetchQuery(
        userPreferencesQueries.getUserPreferences(),
      );

      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("Sign in error:", err);
    }
  }

  const isLoading = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
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
                data-testid="sign-in-email-input"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              </div>
              <Input
                {...field}
                id={field.name}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
                disabled={isLoading}
                data-testid="sign-in-password-input"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}

              {/*<button
                  type="button"
                  className="text-primary ml-auto -mb-3 shrink w-auto! hover:text-primary/80 text-sm font-medium underline-offset-4 transition-colors hover:underline"
                >
                  Forgot password?
                </button>*/}
            </Field>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          data-testid="sign-in-submit"
        >
          {isLoading ? (
            <>
              <Spinner />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
