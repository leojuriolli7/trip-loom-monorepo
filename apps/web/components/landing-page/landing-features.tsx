"use client";

import Image from "next/image";
import { motion } from "motion/react";

const features = [
  {
    title: "Multi-Agent Intelligence",
    description:
      "Specialized agents for flights, hotels, and destinations work together to weave your perfect trip.",
    icon: "/compass.png",
  },
  {
    title: "Seamless Bookings",
    description:
      "Search and book flights and hotels across the globe without ever leaving the conversation.",
    icon: "/plane.png",
  },
  {
    title: "Smart Itineraries",
    description:
      "Get personalized daily plans with activities tailored to your interests and travel style.",
    icon: "/map.png",
  },
  {
    title: "Human-in-the-Loop",
    description:
      "The AI handles the heavy lifting, but you stay in control with intuitive confirmation widgets.",
    icon: "/wallet.png",
  },
];

export function LandingFeatures() {
  return (
    <section className="relative px-6 py-24 md:py-36">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for the way you travel
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.08,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="group relative flex gap-5 rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="relative shrink-0">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={96}
                  height={96}
                  className="size-20 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
