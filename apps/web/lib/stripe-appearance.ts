import type { Appearance } from "@stripe/stripe-js";

export function getAppearance(isDark: boolean): Appearance {
  return {
    theme: isDark ? "night" : "stripe",
    variables: {
      // Colors
      colorPrimary: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
      colorBackground: isDark
        ? "oklch(0.24 0.012 58)"
        : "oklch(0.997 0.004 80)",
      colorText: isDark ? "oklch(0.94 0.01 80)" : "oklch(0.22 0.02 55)",
      colorTextSecondary: isDark
        ? "oklch(0.77 0.015 72)"
        : "oklch(0.5 0.02 55)",
      colorTextPlaceholder: isDark
        ? "oklch(0.77 0.015 72)"
        : "oklch(0.5 0.02 55)",
      colorDanger: isDark
        ? "oklch(0.704 0.191 22.216)"
        : "oklch(0.577 0.245 27.325)",
      colorSuccess: "#22c55e",
      colorWarning: "#f59e0b",

      // Borders
      colorIconCardError: isDark
        ? "oklch(0.704 0.191 22.216)"
        : "oklch(0.577 0.245 27.325)",

      // Typography
      fontFamily: "Figtree, system-ui, sans-serif",
      fontSizeBase: "14px",
      fontWeightNormal: "400",
      fontWeightMedium: "500",
      fontWeightBold: "600",

      // Spacing & Sizing
      spacingUnit: "4px",
      borderRadius: "9999px", // Matches rounded-4xl for pill-shaped inputs

      // Focus
      focusBoxShadow: isDark
        ? "0 0 0 3px oklch(0.79 0.15 72 / 0.5)"
        : "0 0 0 3px oklch(0.65 0.12 55 / 0.5)",
      focusOutline: "none",
    },
    rules: {
      ".Input": {
        backgroundColor: isDark
          ? "oklch(0.3 0.012 58 / 0.3)"
          : "oklch(0.92 0.015 65 / 0.3)",
        border: isDark
          ? "1px solid oklch(0.4 0.015 58)"
          : "1px solid oklch(0.92 0.015 65)",
        borderRadius: "9999px",
        padding: "10px 14px",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      },
      ".Input:focus": {
        borderColor: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.12 55)",
        boxShadow: isDark
          ? "0 0 0 3px oklch(0.79 0.15 72 / 0.5)"
          : "0 0 0 3px oklch(0.65 0.12 55 / 0.5)",
      },
      ".Input--invalid": {
        borderColor: isDark
          ? "oklch(0.704 0.191 22.216 / 0.5)"
          : "oklch(0.577 0.245 27.325)",
        boxShadow: isDark
          ? "0 0 0 3px oklch(0.704 0.191 22.216 / 0.4)"
          : "0 0 0 3px oklch(0.577 0.245 27.325 / 0.2)",
      },
      ".Label": {
        fontSize: "14px",
        fontWeight: "500",
        marginBottom: "6px",
        color: isDark ? "oklch(0.94 0.01 80)" : "oklch(0.22 0.02 55)",
      },
      ".Error": {
        fontSize: "13px",
        marginTop: "6px",
        color: isDark
          ? "oklch(0.704 0.191 22.216)"
          : "oklch(0.577 0.245 27.325)",
      },
      ".Tab": {
        borderRadius: "9999px",
        border: isDark
          ? "1px solid oklch(0.4 0.015 58)"
          : "1px solid oklch(0.92 0.015 65)",
        backgroundColor: isDark
          ? "oklch(0.3 0.012 58 / 0.3)"
          : "oklch(0.92 0.015 65 / 0.3)",
      },
      ".Tab:hover": {
        borderColor: isDark ? "oklch(0.5 0.015 58)" : "oklch(0.85 0.015 65)",
      },
      ".Tab--selected": {
        borderColor: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
        backgroundColor: isDark
          ? "oklch(0.79 0.15 72 / 0.1)"
          : "oklch(0.65 0.165 55 / 0.1)",
      },
      ".TabIcon--selected": {
        fill: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
      },
      ".TabLabel--selected": {
        color: isDark ? "oklch(0.79 0.15 72)" : "oklch(0.65 0.165 55)",
      },
    },
  };
}
