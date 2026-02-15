"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { SignInForm } from "./_components/sign-in-form";
import { SignUpForm } from "./_components/sign-up-form";

type AuthMode = "sign-in" | "sign-up";

// TODO: Page can be better looking, perhaps with an image on the left-side part.
export default function EnterPage() {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  const toggleMode = () => {
    setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"));
  };

  return (
    <div className="bg-background relative flex min-h-svh">
      {/* Left side - Visual branding */}
      <div className="bg-primary/5 relative hidden w-1/2 overflow-hidden lg:block">
        {/* Decorative gradient orbs */}
        <div className="bg-primary/20 absolute -left-32 -top-32 size-96 rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute -bottom-48 -right-24 size-[500px] rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <div className="flex size-10 items-center justify-center rounded-xl">
              <Image
                src="/logo.png"
                alt="TripLoom"
                width={28}
                height={28}
                className="drop-shadow-sm"
              />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              TripLoom
            </span>
          </div>

          {/* Main visual */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <div className="relative mx-auto mb-8 size-48">
                <Image
                  src="/statue-liberty.png"
                  alt="Travel"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight">
                Weaving your
                <br />
                <span className="text-primary">perfect journey</span>
              </h1>
              <p className="text-muted-foreground mx-auto max-w-sm text-lg">
                Your AI travel agent that plans, books, and organizes everything
                in one place.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex flex-1 flex-col">
        {/* Mobile logo */}
        <div className="flex items-center gap-1 p-6 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-xl">
            <Image
              src="/logo.png"
              alt="TripLoom"
              width={24}
              height={24}
              className="drop-shadow-sm"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight">TripLoom</span>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "sign-in" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "sign-in" ? 20 : -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {/* Header */}
                <div className="mb-7 text-center">
                  <h2 className="mb-2 text-2xl font-bold tracking-tight">
                    {mode === "sign-in" ? "Welcome back" : "Create an account"}
                  </h2>
                  <p className="text-muted-foreground">
                    {mode === "sign-in"
                      ? "Sign in to continue your journey"
                      : "Start planning your next adventure"}
                  </p>
                </div>

                {/* Form */}
                {mode === "sign-in" ? <SignInForm /> : <SignUpForm />}

                {/* Toggle */}
                <p className="text-muted-foreground mt-4 text-center text-sm">
                  {mode === "sign-in"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary hover:text-primary/80 font-medium underline-offset-4 transition-colors hover:underline"
                  >
                    {mode === "sign-in" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
