import { useMemo } from "react";
import { useTheme } from "next-themes";
import { mapStyles } from "./map-styles";

const resolveCssVar = (value: string) => {
  if (typeof window === "undefined") return value;

  const match = value.match(/^var\((--[^)]+)\)$/);
  if (!match) return value;

  return getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
};

export const useMapTheme = () => {
  const { resolvedTheme } = useTheme();

  const mapTheme = useMemo(
    () =>
      mapStyles.map((style) => ({
        ...style,
        stylers: style.stylers?.map((s) =>
          "color" in s && typeof s.color === "string"
            ? {
                ...s,
                color: resolveCssVar(s.color),
              }
            : s,
        ),
      })),
    // eslint-disable-next-line
    [resolvedTheme],
  );

  const mapBgColor = useMemo(
    () => resolveCssVar("var(--background)"),
    // eslint-disable-next-line
    [resolvedTheme],
  );

  return {
    mapTheme,
    mapBgColor,
  };
};

export default useMapTheme;
