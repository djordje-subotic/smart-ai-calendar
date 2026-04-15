"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light" | "system";

const STORAGE_KEY = "krowna-theme-v1";
const LEGACY_STORAGE_KEY = "krowna-theme-v1";

function resolveSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readStored(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    let v = localStorage.getItem(STORAGE_KEY);
    if (v === null) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        v = legacy;
      }
    }
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "dark";
}

/**
 * Applies the resolved theme to the <html> element. Removes/adds `dark` and
 * `light` classes. Used by the small inline bootstrap script and by the
 * toggle itself.
 */
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? resolveSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolved);
  // Update theme-color for iOS/Android browser chrome
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "light" ? "#f7f6fb" : "#0f0b15");
  }
}

export function ThemeToggle() {
  // Lazy init reads localStorage once on mount — avoids a cascade render
  // from setState-in-effect.
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "dark" : readStored()
  );

  useEffect(() => {
    applyTheme(theme);

    // When set to "system", react to OS-level changes live.
    if (theme === "system" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  function set(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    // The useEffect above will re-apply the theme on state change
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border/40 bg-muted/20 p-1">
      <Button
        type="button"
        size="sm"
        variant={theme === "dark" ? "secondary" : "ghost"}
        onClick={() => set("dark")}
        className="h-8 px-3 text-xs"
      >
        <Moon className="mr-1 h-3 w-3" /> Dark
      </Button>
      <Button
        type="button"
        size="sm"
        variant={theme === "light" ? "secondary" : "ghost"}
        onClick={() => set("light")}
        className="h-8 px-3 text-xs"
      >
        <Sun className="mr-1 h-3 w-3" /> Light
      </Button>
      <Button
        type="button"
        size="sm"
        variant={theme === "system" ? "secondary" : "ghost"}
        onClick={() => set("system")}
        className="h-8 px-3 text-xs"
      >
        <MonitorSmartphone className="mr-1 h-3 w-3" /> Auto
      </Button>
    </div>
  );
}

/**
 * Inline bootstrap script to prevent a light-theme flash on first paint when
 * the user has selected light mode. Injected via <Script strategy="beforeInteractive">.
 */
export const THEME_BOOTSTRAP_SCRIPT = `
(function() {
  try {
    var v = localStorage.getItem('${STORAGE_KEY}');
    if (v === null) {
      var legacy = localStorage.getItem('${LEGACY_STORAGE_KEY}');
      if (legacy !== null) {
        localStorage.setItem('${STORAGE_KEY}', legacy);
        localStorage.removeItem('${LEGACY_STORAGE_KEY}');
        v = legacy;
      }
    }
    var theme = (v === 'light' || v === 'dark' || v === 'system') ? v : 'dark';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    var root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(resolved);
  } catch (e) {}
})();
`.trim();
