"use client";

import Image from "next/image";
import { ArrowUpRightIcon } from "lucide-react";
import { focusChatInput } from "../chat-input-focus";

interface GreetingProps {
  userName: string;
}

export function Greeting({ userName }: GreetingProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <section className="relative overflow-hidden py-10 lg:py-14">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/8 via-transparent to-chart-2/7" />
      <div className="absolute -left-24 top-10 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-28 bottom-0 -z-10 size-72 rounded-full bg-chart-2/15 blur-3xl" />

      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="relative overflow-hidden px-0 py-2 lg:py-3">
          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-xl flex-col gap-3">
              <h1
                data-testid="greeting-message"
                className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl"
              >
                {getGreeting()}, {userName}
              </h1>
              <p className="max-w-xl text-base leading-6 text-muted-foreground sm:text-lg sm:leading-7">
                Where would you like to go next? Let me help you book your
                perfect trip with richer, better-tailored suggestions.
              </p>
            </div>

            <div className="hidden items-center gap-4 lg:flex">
              <div className="relative rounded-3xl backdrop-blur-sm">
                <Image src="/plane.png" alt="" width={132} height={132} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-4 grid-cols-1 xl:grid-cols-3">
          <QuickAction
            icon="/island.png"
            hoverIcon="/japanese-temple.png"
            title="Explore destinations"
            description="Discover your next adventure"
          />
          <QuickAction
            icon="/bungalow.png"
            hoverIcon="/camping.png"
            title="Book accommodations"
            description="Find the perfect place to stay"
          />
          <QuickAction
            icon="/backpack.png"
            hoverIcon="/map.png"
            title="Plan itinerary"
            description="Create your travel schedule"
          />
        </div>
      </div>
    </section>
  );
}

interface QuickActionProps {
  icon: string;
  hoverIcon?: string;
  title: string;
  description: string;
}

/**
 * TODO: Each one of these could be an MCP prompt implementation, or could
 * just redirect to the chat page, with suggestions there on the input box on what to write...
 */
function QuickAction({
  icon,
  hoverIcon,
  title,
  description,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={focusChatInput}
      className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-card via-card to-secondary/35 p-4 text-left shadow-[0_18px_30px_-28px_rgba(15,23,42,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_34px_-24px_rgba(208,115,48,0.35)]"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/12 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
        <Image
          src={icon}
          alt=""
          width={80}
          height={80}
          className={
            hoverIcon
              ? "transition-all duration-200 group-hover:scale-110 group-hover:opacity-0"
              : "transition-transform duration-200 group-hover:scale-110"
          }
        />
        {hoverIcon ? (
          <Image
            src={hoverIcon}
            alt=""
            width={80}
            height={80}
            className="absolute opacity-0 transition-all duration-200 group-hover:scale-110 group-hover:opacity-100"
          />
        ) : null}
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary/85">
          Try prompt
          <ArrowUpRightIcon className="size-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </button>
  );
}
