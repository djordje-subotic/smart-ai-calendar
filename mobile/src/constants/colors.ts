/**
 * Theme-aware color palette.
 *
 * `colors` is a live-binding — components read `colors.background` etc. and we
 * mutate the object properties when the theme changes. That means every new
 * render picks up the new colors without touching individual components.
 *
 * Call `setTheme("light" | "dark")` to flip — `useTheme()` hooks into the
 * store for components that need to re-render on change.
 */

type Palette = {
  background: string;
  card: string;
  cardHover: string;
  border: string;
  foreground: string;
  muted: string;
  mutedLight: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryForeground: string;
  accent: string;
  destructive: string;
  green: string;
  blue: string;
  violet: string;
  cyan: string;
  orange: string;
  pink: string;
  gradientStart: string;
  gradientEnd: string;
};

const darkPalette: Palette = {
  background: "#0f0b15",
  card: "#1a1525",
  cardHover: "#221d2d",
  border: "#2a2435",
  foreground: "#f5f0fa",
  muted: "#7a7484",
  mutedLight: "#9a94a4",
  primary: "#F59E0B",
  primaryDark: "#D97706",
  primaryLight: "#FBBF24",
  primaryForeground: "#0f0b15",
  accent: "#1e1929",
  destructive: "#EF4444",
  green: "#10B981",
  blue: "#3B82F6",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
  orange: "#F97316",
  pink: "#EC4899",
  gradientStart: "#D97706",
  gradientEnd: "#FBBF24",
};

const lightPalette: Palette = {
  background: "#faf8f5",
  card: "#ffffff",
  cardHover: "#f4f0e9",
  border: "#e8e2d8",
  foreground: "#1a1320",
  muted: "#6b6475",
  mutedLight: "#9b95a4",
  primary: "#D97706",
  primaryDark: "#B45309",
  primaryLight: "#F59E0B",
  primaryForeground: "#ffffff",
  accent: "#faf4e8",
  destructive: "#DC2626",
  green: "#059669",
  blue: "#2563EB",
  violet: "#7C3AED",
  cyan: "#0891B2",
  orange: "#EA580C",
  pink: "#DB2777",
  gradientStart: "#D97706",
  gradientEnd: "#FBBF24",
};

/**
 * The exported `colors` object is mutated in place when the theme changes so
 * existing `StyleSheet.create` calls (which capture values at creation time)
 * keep working AND new renders pick up fresh values. Dynamic styles
 * (inline on-render) always see the latest palette.
 */
export const colors: Palette = { ...darkPalette };

export type ThemeName = "dark" | "light";
let currentTheme: ThemeName = "dark";
const subscribers = new Set<() => void>();

export function getTheme(): ThemeName {
  return currentTheme;
}

export function setTheme(theme: ThemeName) {
  if (currentTheme === theme) return;
  currentTheme = theme;
  const next = theme === "light" ? lightPalette : darkPalette;
  Object.assign(colors, next);
  subscribers.forEach((fn) => fn());
}

export function subscribeTheme(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export const EVENT_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];
