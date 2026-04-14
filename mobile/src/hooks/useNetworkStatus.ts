import { useEffect, useState } from "react";

/**
 * Lightweight online/offline detector.
 *
 * We deliberately avoid pulling in @react-native-community/netinfo — a periodic
 * HEAD ping is good enough for UI decisions (show banner, defer writes). When
 * the app gets a clean 2xx, we mark online; otherwise offline.
 */

const PING_INTERVAL_MS = 20_000;

// Supabase edge function URL or any CORS-safe endpoint. We use an HTTP GET
// against supabase's health endpoint — fast, cheap, and always available.
function getPingUrl() {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (base) return `${base}/rest/v1/`;
  return "https://www.google.com/generate_204";
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = getPingUrl();

    async function ping() {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(url, {
          method: "GET",
          signal: ctrl.signal,
          cache: "no-store",
        });
        clearTimeout(t);
        if (!cancelled) setOnline(res.ok || res.status === 401 || res.status === 204);
      } catch {
        if (!cancelled) setOnline(false);
      }
    }

    ping();
    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return online;
}
