"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { SignInForm } from "./_components/sign-in-form";
import { SignUpForm } from "./_components/sign-up-form";

type AuthMode = "sign-in" | "sign-up";

export default function EnterPage() {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  const toggleMode = () => {
    setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"));
  };

  return (
    <div className="bg-background relative flex min-h-svh">
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src="/enter-hero-3.jpg"
          alt="Travel destination"
          fill
          className="object-cover"
          priority
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

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

      <div className="flex flex-1 flex-col">
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

                {mode === "sign-in" ? <SignInForm /> : <SignUpForm />}

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
