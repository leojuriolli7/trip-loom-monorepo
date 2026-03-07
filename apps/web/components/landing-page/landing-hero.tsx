"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Immersive Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/enter-hero.jpg"
          alt="Beautiful beach travel destination"
          className="h-full w-full object-cover"
        />
        {/* Refined overlays — cinematic gradient */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/70" />
        {/* Subtle warm tint */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-4xl"
      >
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md"
        >
          <div className="size-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-xs font-medium tracking-wide text-white/80">
            AI-powered travel planning
          </span>
        </motion.div>

        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-[5.5rem] md:leading-[1.05]">
          Travel at the <br />
          <span className="bg-linear-to-r from-amber-300 via-orange-300 to-primary bg-clip-text text-transparent">
            speed of thought
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mt-8 max-w-xl text-base leading-relaxed font-light text-white/70 md:text-lg"
        >
          Plan and book entire trips in a single conversation. No more jumping
          between tabs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            variant="default"
            className="h-12 px-8 text-sm font-semibold shadow-2xl shadow-black/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
          >
            <Link href="/chat">
              Start Planning
              <ArrowRightIcon className="ml-1.5 size-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-white/20 bg-white/5 px-8 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:text-white"
          >
            <Link href="#demo">See it in action</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
