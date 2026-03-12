import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudMoon,
  CloudMoonRain,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Moon,
  Sun,
  Zap,
} from "lucide-react";

export type WeatherConditionVariant =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "storm"
  | "snow";

export type WeatherDayPhase = "day" | "night";

type WeatherVisualConfig = {
  title: string;
  description: string;
  imageByPhase: Record<WeatherDayPhase, string>;
  iconByPhase: Record<WeatherDayPhase, LucideIcon>;
  cardClassName: string;
  heroOverlayClassName: string;
};

export const weatherVisualRegistry: Record<
  WeatherConditionVariant,
  WeatherVisualConfig
> = {
  clear: {
    title: "Clear",
    description: "Bright skies and the cleanest view of the day",
    imageByPhase: {
      day: "/clear-day.png",
      night: "/clear-night.png",
    },
    iconByPhase: {
      day: Sun,
      night: Moon,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-chart-4/12 border-chart-4/20",
    heroOverlayClassName:
      "bg-linear-to-t from-card/85 via-card/18 to-transparent",
  },
  "partly-cloudy": {
    title: "Partly cloudy",
    description: "A soft mix of sun and passing cloud cover",
    imageByPhase: {
      day: "/partly-cloudy-day.png",
      night: "/partly-cloudy-night.png",
    },
    iconByPhase: {
      day: CloudSun,
      night: CloudMoon,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-chart-2/12 border-chart-2/20",
    heroOverlayClassName:
      "bg-linear-to-t from-card/88 via-card/25 to-transparent",
  },
  cloudy: {
    title: "Cloudy",
    description: "A muted, overcast sky with softer daylight",
    imageByPhase: {
      day: "/cloudy-day.png",
      night: "/cloudy-night.png",
    },
    iconByPhase: {
      day: Cloud,
      night: Cloud,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-muted/45 border-border/80",
    heroOverlayClassName:
      "bg-linear-to-t from-card/90 via-card/28 to-transparent",
  },
  fog: {
    title: "Foggy",
    description: "Low visibility and a calm, hazy atmosphere",
    imageByPhase: {
      day: "/fog-day.png",
      night: "/fog-night.png",
    },
    iconByPhase: {
      day: CloudFog,
      night: CloudFog,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-accent/15 border-accent/20",
    heroOverlayClassName:
      "bg-linear-to-t from-card/92 via-card/28 to-transparent",
  },
  drizzle: {
    title: "Drizzle",
    description: "Light rain with a soft, misty feel",
    imageByPhase: {
      day: "/drizzle-day.png",
      night: "/drizzle-night.png",
    },
    iconByPhase: {
      day: CloudDrizzle,
      night: CloudDrizzle,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-chart-1/14 border-chart-1/20",
    heroOverlayClassName:
      "bg-linear-to-t from-card/92 via-card/30 to-transparent",
  },
  rain: {
    title: "Rain",
    description: "Wet conditions with showers through the day",
    imageByPhase: {
      day: "/rain-day.png",
      night: "/rain-night.png",
    },
    iconByPhase: {
      day: CloudSunRain,
      night: CloudMoonRain,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-primary/12 border-primary/18",
    heroOverlayClassName:
      "bg-linear-to-t from-card/92 via-card/32 to-transparent",
  },
  storm: {
    title: "Storm",
    description: "Thunderstorm risk with darker skies and bursts of rain",
    imageByPhase: {
      day: "/storm-day.png",
      night: "/storm-night.png",
    },
    iconByPhase: {
      day: Zap,
      night: Zap,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-destructive/10 border-destructive/20",
    heroOverlayClassName:
      "bg-linear-to-t from-card/94 via-card/35 to-transparent",
  },
  snow: {
    title: "Snow",
    description: "Cold air, flurries, and a wintry surface feel",
    imageByPhase: {
      day: "/snow-day.png",
      night: "/snow-night.png",
    },
    iconByPhase: {
      day: CloudSnow,
      night: CloudSnow,
    },
    cardClassName:
      "bg-linear-to-br from-card via-card to-chart-5/16 border-chart-5/22",
    heroOverlayClassName:
      "bg-linear-to-t from-card/90 via-card/25 to-transparent",
  },
};

export function getWeatherConditionVariant(
  weatherCode: number | null | undefined,
): WeatherConditionVariant {
  if (weatherCode === 0) {
    return "clear";
  }

  if (weatherCode === 1 || weatherCode === 2) {
    return "partly-cloudy";
  }

  if (weatherCode === 3) {
    return "cloudy";
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return "fog";
  }

  if ([51, 53, 55, 56, 57].includes(weatherCode ?? -1)) {
    return "drizzle";
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode ?? -1)) {
    return "snow";
  }

  if ([95, 96, 99].includes(weatherCode ?? -1)) {
    return "storm";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode ?? -1)) {
    return "rain";
  }

  return "cloudy";
}
