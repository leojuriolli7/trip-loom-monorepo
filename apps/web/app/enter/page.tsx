"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { SignInForm } from "@/components/forms/sign-in-form";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { VerifyEmailForm } from "@/components/forms/verify-email-form";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "verify-email";

const modeHeaders: Record<
  AuthMode,
  { title: string; subtitle: string; testId: string }
> = {
  "sign-in": {
    title: "Welcome back",
    subtitle: "Sign in to continue your journey",
    testId: "sign-in-title",
  },
  "sign-up": {
    title: "Create an account",
    subtitle: "Start planning your next adventure",
    testId: "sign-up-title",
  },
  "forgot-password": {
    title: "Forgot password?",
    subtitle: "Enter your email and we'll send you a reset link",
    testId: "forgot-password-title",
  },
  "verify-email": {
    title: "",
    subtitle: "",
    testId: "",
  },
};

const modeFooter: Record<
  AuthMode,
  {
    text: string;
    actionLabel: string;
    targetMode: AuthMode;
    testId: string;
  } | null
> = {
  "sign-in": {
    text: "Don't have an account?",
    actionLabel: "Register",
    targetMode: "sign-up",
    testId: "toggle-to-sign-up",
  },
  "sign-up": {
    text: "Already have an account?",
    actionLabel: "Login",
    targetMode: "sign-in",
    testId: "toggle-to-sign-in",
  },
  "forgot-password": {
    text: "Remember your password?",
    actionLabel: "Login",
    targetMode: "sign-in",
    testId: "toggle-to-sign-in",
  },
  "verify-email": null,
};

export default function EnterPage() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [signUpEmail, setSignUpEmail] = useState("");

  const header = modeHeaders[mode];
  const footer = modeFooter[mode];

  const handleSignUpSuccess = (email: string) => {
    setSignUpEmail(email);
    setMode("verify-email");
  };

  return (
    <div className="bg-background relative flex min-h-svh">
      {/* Mobile: Full-screen blurred background */}
      <div className="fixed inset-0 lg:hidden">
        <Image
          fetchPriority="high"
          loading="eager"
          src="/enter-hero-2.jpg"
          alt="Beach view with the ocean on the left-side and palm trees on the right-side, sunny day, blue sky"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-background/40" />
      </div>

      {/* Desktop: Left side hero panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src="/enter-hero-3.jpg"
          alt="A bright pink inflatable flamingo float sits on clear turquoise ocean water, photographed half-above and half-below the surface, with sunlight flaring in a blue sky and a distant shoreline on the horizon."
          fill
          className="object-cover"
          priority
        />

        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

        {/* Content floating on image */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Location pin made with an orange woven material"
              width={32}
              height={32}
              className="drop-shadow-lg"
            />
            <span className="text-xl font-semibold tracking-tight text-white drop-shadow-lg">
              TripLoom
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="max-w-md"
          >
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-lg xl:text-5xl">
              Weaving your
              <br />
              <span className="text-primary">perfect journey</span>
            </h1>
            <p className="text-lg text-white/80 drop-shadow-md">
              Your AI travel agent that plans, books, and organizes everything
              in one place.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side / Mobile: Auth forms */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 p-6 lg:hidden"
        >
          <Image
            fetchPriority="high"
            loading="eager"
            src="/logo.png"
            alt="Location pin made with an orange woven material"
            width={28}
            height={28}
            className="drop-shadow-md"
          />
          <span className="text-lg font-semibold tracking-tight drop-shadow-sm">
            TripLoom
          </span>
        </motion.div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
          {/* Frosted glass card on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-sm rounded-3xl bg-card/80 px-6 py-8 shadow-xl ring-1 ring-border/50 backdrop-blur-md lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0 lg:backdrop-blur-none"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "sign-in" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "sign-in" ? 20 : -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {/* Header - hidden for verify-email since it has its own */}
                {header.title && (
                  <div className="mb-7 text-center">
                    <h2
                      data-testid={header.testId}
                      className="mb-2 text-2xl font-bold tracking-tight"
                    >
                      {header.title}
                    </h2>
                    <p className="text-muted-foreground">{header.subtitle}</p>
                  </div>
                )}

                {mode === "sign-in" && (
                  <SignInForm
                    onForgotPassword={() => setMode("forgot-password")}
                  />
                )}
                {mode === "sign-up" && (
                  <SignUpForm onSignUpSuccess={handleSignUpSuccess} />
                )}
                {mode === "forgot-password" && (
                  <ForgotPasswordForm
                    onBackToLogin={() => setMode("sign-in")}
                  />
                )}
                {mode === "verify-email" && (
                  <VerifyEmailForm email={signUpEmail} />
                )}

                {footer && (
                  <p className="text-muted-foreground mt-4 text-center text-sm">
                    {footer.text}{" "}
                    <button
                      type="button"
                      onClick={() => setMode(footer.targetMode)}
                      className="text-primary hover:text-primary/80 font-medium underline-offset-4 transition-colors hover:underline"
                      data-testid={footer.testId}
                    >
                      {footer.actionLabel}
                    </button>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
