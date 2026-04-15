import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getTheme, setTheme, subscribeTheme, type ThemeName } from "../constants/colors";

const STORAGE_KEY = "krowna-theme-v1";

/**
 * React hook that re-renders consumers when the theme flips. Also hydrates
 * the stored preference on first mount so the user's choice persists across
 * cold starts.
 */
export function useTheme(): { theme: ThemeName; setTheme: (t: ThemeName) => Promise<void> } {
  const [, force] = useState(0);

  useEffect(() => {
    const unsub = subscribeTheme(() => force((n) => n + 1));
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") setTheme(stored);
      })
      .catch(() => {});
    return unsub;
  }, []);

  const persistAndSet = async (next: ThemeName) => {
    setTheme(next);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, next);
    } catch {}
  };

  return { theme: getTheme(), setTheme: persistAndSet };
}
