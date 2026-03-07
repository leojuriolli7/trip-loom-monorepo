"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="relative px-6 py-24 md:py-36">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/6 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Ready to plan your{" "}
          <span className="bg-linear-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
            next adventure?
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-muted-foreground md:text-lg">
          Start planning stress-free trips in minutes with your AI travel agent.
        </p>
        <div className="mt-10 flex justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-sm font-semibold shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
          >
            <Link href="/chat">
              Get Started
              <ArrowRightIcon className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
