// Kron service worker
//
// Lightweight SW focused on:
//   1. Showing event-reminder notifications when the tab is backgrounded
//      (we post a message from the page to "schedule" a reminder; the SW
//      runs a setTimeout so the notification fires even if the tab loses
//      focus — the SW can stay alive longer than the page).
//   2. Making Kron installable as a PWA (minimal fetch handler).
//
// We deliberately skip push subscriptions / VAPID for now — that needs a
// server-side push service, which adds infra cost. The in-page scheduler +
// this SW covers the 90% case (browser open but tab backgrounded).

const CACHE_NAME = "kron-v1";

self.addEventListener("install", (event) => {
  // Activate immediately so users get the new SW without hard-refresh
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

// Minimal fetch handler — network-first, no aggressive caching. Avoids serving
// stale auth tokens or stale Supabase responses from cache.
self.addEventListener("fetch", (event) => {
  // Let the browser handle everything normally.
  return;
});

// ----- Reminder scheduling -----
// The page posts: { type: "schedule-reminder", key, fireAt, title, body, tag }
// We setTimeout locally; at fireTime we show a notification via self.registration.

const timers = new Map();

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "schedule-reminder") {
    const { key, fireAt, title, body, tag } = data;
    if (!key || !fireAt || !title) return;

    // Clear any existing timer for this key
    if (timers.has(key)) clearTimeout(timers.get(key));

    const delay = fireAt - Date.now();
    if (delay <= 0) return;

    const timerId = setTimeout(async () => {
      try {
        await self.registration.showNotification(title, {
          body: body || "",
          tag: tag || key,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: false,
          data: { key, url: "/calendar" },
        });
      } catch {}
      timers.delete(key);
    }, delay);

    timers.set(key, timerId);
  }

  if (data.type === "clear-reminders") {
    for (const id of timers.values()) clearTimeout(id);
    timers.clear();
  }

  if (data.type === "clear-reminder") {
    const { key } = data;
    if (key && timers.has(key)) {
      clearTimeout(timers.get(key));
      timers.delete(key);
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/calendar";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Focus an existing Kron tab if available
      for (const client of all) {
        if (client.url.includes(self.location.origin)) {
          await client.focus();
          client.postMessage({ type: "notification-click", url: targetUrl });
          return;
        }
      }
      // Otherwise open a new one
      await self.clients.openWindow(targetUrl);
    })()
  );
});
