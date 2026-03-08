"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { TransferAgentToolCard } from "@/components/tools/transfer-agent-tool-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPinIcon, ArrowRightIcon, SendIcon, StarIcon } from "lucide-react";
import Image from "next/image";

// Mock Tool Cards for the demo (simplified versions to avoid hooks/context dependencies)

function MockUserPreferences() {
  return (
    <ToolCallCard className="border-border/40 bg-muted/5">
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/duffel.png" alt="Duffel bag" />
        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>Read your travel preferences</ToolCallCard.Title>
          <ToolCallCard.Description>
            Checked your saved profile so new suggestions match your style,
            budget, and comfort needs
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}

function MockWebSearch() {
  return (
    <ToolCallCard className="border-border/40 bg-muted/5">
      <ToolCallCard.Header className="justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <ToolCallCard.Image
            src="/globe.png"
            alt="Globe"
            className="scale-110"
          />
          <ToolCallCard.HeaderContent className="min-w-0 pt-0.5">
            <ToolCallCard.Title>Web Search</ToolCallCard.Title>
            <ToolCallCard.Description>
              Performed 3 online searches
            </ToolCallCard.Description>
          </ToolCallCard.HeaderContent>
        </div>
      </ToolCallCard.Header>
      <ToolCallCard.Content>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>Best cherry blossom spots in Kyoto 2026</li>
          <li>Top luxury ryokans Kyoto</li>
          <li>10 day Kyoto cultural itinerary</li>
        </ul>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}

function MockSuggestDestinations() {
  return (
    <ToolCallCard size="lg" className="border-primary/20 bg-primary/5">
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/map.png" alt="Map" />
        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>Top picks for your April trip</ToolCallCard.Title>
          <ToolCallCard.Description>
            {`I've found 3 destinations that match your interest in culture and
            mild weather.`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
      <ToolCallCard.Content className="no-scrollbar flex gap-3 overflow-x-auto pb-2 pt-2">
        {[
          {
            name: "Kyoto, Japan",
            img: "/kyoto.webp",
            tags: ["Culture", "Zen"],
          },
          { name: "Rome, Italy", img: "/rome.webp", tags: ["History", "Food"] },
          {
            name: "Santorini, Greece",
            img: "/santorini.jpg",
            tags: ["Views", "Relax"],
          },
        ].map((d, i) => (
          <div
            key={i}
            className="flex w-[180px] shrink-0 flex-col rounded-2xl border border-border/50 bg-card p-3 shadow-sm transition-colors hover:border-primary/30"
          >
            <div className="relative mb-3 aspect-4/5 overflow-hidden rounded-xl bg-muted">
              <img
                src={d.img}
                alt={d.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            <div className="flex flex-1 flex-col">
              <p className="mb-2 text-sm font-bold tracking-tight text-foreground">
                {d.name}
              </p>
              <div className="mt-auto flex flex-wrap gap-1">
                {d.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="border-primary/10 bg-primary/5 px-1.5 py-0 text-[10px] font-medium text-primary/80"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}

function MockSuggestHotel() {
  return (
    <ToolCallCard size="lg" className="shadow-xl shadow-amber-900/5">
      <ToolCallCard.Header className="gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-amber-200/50 shadow-inner">
          <img
            src="/hotel-luxury-room.webp"
            alt="Hotel Room"
            className="h-full w-full object-cover"
          />
        </div>
        <ToolCallCard.HeaderContent className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Badge className="h-5 border-none bg-amber-100 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-amber-900 hover:bg-amber-100">
              Top Rated
            </Badge>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon
                  key={i}
                  className="size-2.5 fill-amber-500 text-amber-500"
                />
              ))}
            </div>
          </div>
          <ToolCallCard.Title className="text-lg leading-tight">
            The Ritz-Carlton, Kyoto
          </ToolCallCard.Title>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="size-3" /> Kamigyo Ward, Kyoto
          </p>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
      <ToolCallCard.Content>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/40 bg-muted/30 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Price
            </p>
            <p className="text-sm font-bold">
              $840
              <span className="text-[10px] font-normal text-muted-foreground">
                /night
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/30 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Rating
            </p>
            <p className="text-sm font-bold">
              4.9
              <span className="text-[10px] font-normal text-muted-foreground">
                {" "}
                / 5.0
              </span>
            </p>
          </div>
        </div>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}

function MockItinerary() {
  return (
    <ToolCallCard size="lg">
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/calendar.png" alt="Itinerary" />
        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>Your 10-Day Kyoto Journey</ToolCallCard.Title>
          <ToolCallCard.Description>
            {`I planned a mix of temples, tea ceremonies, and bamboo forests.`}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
      <ToolCallCard.Content className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
              01
            </div>
            <div>
              <p className="text-xs font-semibold">Arashiyama Bamboo Grove</p>
              <p className="text-[10px] text-muted-foreground">
                Morning walk & photography
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Morning
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
              02
            </div>
            <div>
              <p className="text-xs font-semibold">
                Kinkaku-ji (Golden Pavilion)
              </p>
              <p className="text-[10px] text-muted-foreground">
                Historical tour
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Afternoon
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-emerald-700 hover:bg-emerald-100/50"
        >
          View Full 10-Day Itinerary <ArrowRightIcon className="ml-1 size-3" />
        </Button>
      </ToolCallCard.Content>
    </ToolCallCard>
  );
}

type DemoStep = {
  type: "user" | "assistant";
  content: string;
  tool?: React.ReactNode;
};

const DEMO_STEPS: DemoStep[] = [
  {
    type: "user",
    content:
      "I want to go to Japan in April for 10 days. I love culture and history.",
  },
  {
    type: "assistant",
    content: "",
    tool: <MockUserPreferences />,
  },
  {
    type: "assistant",
    content: "",
    tool: <TransferAgentToolCard toolName="transfer_to_destination_agent" />,
  },
  {
    type: "assistant",
    content:
      "April is the perfect time for Japan\u2014it's cherry blossom season! I'm searching for the best destinations for you.",
    tool: <MockSuggestDestinations />,
  },
  {
    type: "user",
    content: "Kyoto looks beautiful. Can you find me a luxury hotel there?",
  },
  {
    type: "assistant",
    content: "",
    tool: <TransferAgentToolCard toolName="transfer_to_hotel_agent" />,
  },
  {
    type: "assistant",
    content:
      "Kyoto has some of the most exquisite traditional-meets-modern hotels in the world. Here's a top recommendation.",
    tool: <MockSuggestHotel />,
  },
  {
    type: "user",
    content:
      "That Ritz-Carlton is stunning. Let's book it and plan my itinerary.",
  },
  {
    type: "assistant",
    content: "",
    tool: <TransferAgentToolCard toolName="transfer_to_itinerary_agent" />,
  },
  {
    type: "assistant",
    content: "",
    tool: <MockWebSearch />,
  },
  {
    type: "assistant",
    content:
      "Excellent choice. I've drafted a 10-day itinerary that balances iconic landmarks with hidden gems.",
    tool: <MockItinerary />,
  },
];

function isTransferStep(step: DemoStep | undefined) {
  return (
    React.isValidElement(step?.tool) && step.tool.type === TransferAgentToolCard
  );
}

export function LandingChatDemo() {
  const [step, setStep] = React.useState(0);
  const [isTyping, setIsTyping] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (step < DEMO_STEPS.length) {
      const nextStep = DEMO_STEPS[step];
      const previousStep = DEMO_STEPS[step - 1];

      const isFastTransition =
        isTransferStep(nextStep) || isTransferStep(previousStep);

      const startDelayMs = isFastTransition ? 650 : 2000;
      const typingMs = isFastTransition ? 550 : 1500;

      const timer = setTimeout(() => {
        setIsTyping(true);
        const typingTimer = setTimeout(() => {
          setIsTyping(false);
          setStep((s) => s + 1);
        }, typingMs);
        return () => clearTimeout(typingTimer);
      }, startDelayMs);
      return () => clearTimeout(timer);
    } else {
      // Loop demo
      const loopTimer = setTimeout(() => {
        setStep(0);
      }, 15000);
      return () => clearTimeout(loopTimer);
    }
  }, [step]);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [step, isTyping]);

  return (
    <section
      id="demo"
      className="relative mx-auto max-w-5xl px-6 py-16 md:py-28"
    >
      {/* Ambient glow behind the demo */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[500px] w-[700px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 text-center"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          How it works
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need, in one place.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Watch how TripLoom agents work together to craft your perfect trip.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative mx-auto max-w-3xl"
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-px rounded-[1.6rem] bg-linear-to-b from-border/80 via-border/40 to-border/80" />

        <div className="relative h-[600px] overflow-hidden rounded-3xl border border-border/50 bg-card shadow-2xl shadow-black/8 md:h-[700px]">
          {/* Window chrome */}
          <div className="flex items-center gap-3 border-b border-border/50 bg-muted/40 px-5 py-3.5">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-border/80" />
              <div className="size-2.5 rounded-full bg-border/80" />
              <div className="size-2.5 rounded-full bg-border/80" />
            </div>
          </div>

          {/* Chat Body */}
          <div
            ref={containerRef}
            className="no-scrollbar h-[calc(100%-130px)] space-y-8 overflow-y-auto px-6 py-8"
          >
            <AnimatePresence initial={false}>
              {DEMO_STEPS.slice(0, step).map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="space-y-4"
                >
                  {s.content && (
                    <Message from={s.type as "user" | "assistant"}>
                      <MessageContent>
                        <MessageResponse>{s.content}</MessageResponse>
                      </MessageContent>
                    </Message>
                  )}
                  {s.tool && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      className="max-w-[95%] md:max-w-[85%]"
                    >
                      {s.tool}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <div className="flex gap-1 rounded-2xl bg-muted/50 px-4 py-3">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="size-1.5 rounded-full bg-muted-foreground"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="size-1.5 rounded-full bg-muted-foreground"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="size-1.5 rounded-full bg-muted-foreground"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat Input Placeholder */}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-card via-card/95 to-card/0 p-5 pt-8">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <span className="text-sm text-muted-foreground/60">
                Ask anything about your trip...
              </span>
              <div className="ml-auto flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <SendIcon className="size-3.5" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
