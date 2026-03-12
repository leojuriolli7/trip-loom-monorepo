"use client";

import type { WeatherResponseDTO } from "@trip-loom/contracts/dto/weather";
import { Sunrise, Sunset } from "lucide-react";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { StreamingImage } from "@/components/streaming-image";
import { cn } from "@/lib/utils";
import {
  formatClock,
  formatDisplayDate,
  formatPercent,
  formatTemperature,
  formatWind,
  getDisplayPayload,
} from "./utils";

type GetWeatherToolCardProps = {
  result: WeatherResponseDTO;
  className?: string;
};

function InlineStat({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/85">
        {label}
      </p>
      <p className="pt-1 text-sm font-semibold text-foreground sm:text-[15px]">
        {value}
      </p>
    </div>
  );
}

export function GetWeatherToolCard({
  result,
  className,
}: GetWeatherToolCardProps) {
  const {
    day,
    iconComponent: IconComponent,
    visual,
    heroImageSrc,
    primaryTemperature,
  } = getDisplayPayload(result);

  const feelsLike = formatTemperature(
    result.current?.apparentTemperatureCelsius ??
      day?.apparentTemperatureMaxCelsius,
  );
  const sunrise = formatClock(day?.sunrise) ?? "--";
  const sunset = formatClock(day?.sunset) ?? "--";

  return (
    <ToolCallCard
      size="lg"
      className={cn("p-0 md:p-0 border-none", visual.cardClassName, className)}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-card/65">
        <div className="relative h-82.5 overflow-hidden">
          <StreamingImage
            src={heroImageSrc}
            alt={`${visual.title} in ${result.location.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
          />
          <div
            className={cn("absolute inset-0", visual.heroOverlayClassName)}
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/8 to-black/45" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="min-w-0 rounded-[1.15rem] bg-card/42 px-3 py-2 text-card-foreground shadow-sm backdrop-blur-md">
              <p className="truncate pt-1 text-lg font-semibold tracking-tight sm:text-xl">
                {result.location.name}
              </p>
              <p className="text-sm text-card-foreground/78">
                {formatDisplayDate(result.requestedStartDate)}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-[1.15rem] bg-card/42 px-3 py-2 text-card-foreground shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Sunrise className="size-4" />
                <span>{sunrise}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Sunset className="size-4" />
                <span>{sunset}</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="w-fit rounded-[1.15rem] bg-card/24 px-3.5 py-3 text-card-foreground shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <p className="text-4xl font-semibold tracking-tight sm:text-[2.7rem]">
                  {primaryTemperature}
                </p>

                <div className="flex items-center gap-1">
                  <IconComponent className="size-5" />

                  <p className="text-xl font-semibold tracking-tight">
                    {visual.title}
                  </p>
                </div>
              </div>

              <p className="line-clamp-2 pt-1 text-sm text-card-foreground/82">
                {visual.description}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <InlineStat
              label="High / Low"
              value={`${formatTemperature(day?.temperatureMaxCelsius)} / ${formatTemperature(day?.temperatureMinCelsius)}`}
            />
            <InlineStat
              label="Rain chance"
              value={formatPercent(day?.precipitationProbabilityMax)}
            />
            <InlineStat label="Wind" value={formatWind(day?.windSpeedMaxKmh)} />
            <InlineStat label="Feels like" value={feelsLike} />
          </div>
        </div>
      </div>
    </ToolCallCard>
  );
}
