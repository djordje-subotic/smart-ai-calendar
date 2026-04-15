/**
 * Browser notifications helper.
 *
 * We use the native Notification API for local reminders. No server push — we
 * look at the next few hours of events on the client and schedule setTimeouts.
 * This keeps things simple and avoids needing a service worker + VAPID setup.
 *
 * For background delivery when the tab is closed, we also register a lightweight
 * service worker that re-schedules timers when the page reloads.
 */

export type NotificationSupport =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationSupport;
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationSupport;
}

const STORAGE_KEY = "krowna-notifications-enabled-v1";
const LEGACY_STORAGE_KEY = "krowna-notifications-enabled-v1";

export function areNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (getNotificationSupport() !== "granted") return false;
  try {
    let value = localStorage.getItem(STORAGE_KEY);
    if (value === null) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        value = legacy;
      }
    }
    return value === "1";
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!areNotificationsEnabled()) return null;
  try {
    const n = new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });
    // Focus the tab when the notification is clicked
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return n;
  } catch {
    return null;
  }
}

type ReminderEvent = {
  id: string;
  title: string;
  start_time: string;
  reminder_minutes?: number[] | null;
  location?: string | null;
};

type ScheduledTimer = { timerId: ReturnType<typeof setTimeout>; fireAt: number };

// Map of key (`${eventId}:${offsetMin}`) → timer info
const scheduled = new Map<string, ScheduledTimer>();

// Service worker registration — lets notifications fire even when the tab
// is backgrounded. Best-effort; silently falls back to in-page setTimeout.
let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => null);
  }
  return swRegistrationPromise;
}

function postToSW(message: unknown) {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Schedule reminders for a set of upcoming events. Re-calling this replaces
 * the previous schedule — safe to call on every events refresh.
 */
export function scheduleEventReminders(events: ReminderEvent[]) {
  if (!areNotificationsEnabled()) return;
  clearAllReminders();

  const now = Date.now();
  const horizonMs = 12 * 60 * 60 * 1000; // only consider events in next 12h
  const hasSW = typeof navigator !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker?.controller;

  for (const event of events) {
    const start = new Date(event.start_time).getTime();
    if (!Number.isFinite(start)) continue;
    if (start - now > horizonMs) continue;
    if (start <= now) continue;

    const offsets = event.reminder_minutes?.length ? event.reminder_minutes : [15];
    for (const offset of offsets) {
      const fireAt = start - offset * 60_000;
      if (fireAt <= now) continue;

      const key = `${event.id}:${offset}`;
      const delay = fireAt - now;
      const minutesText = offset === 0
        ? "starting now"
        : offset === 60
        ? "in 1 hour"
        : offset >= 60
        ? `in ${Math.round(offset / 60)} hours`
        : `in ${offset} min`;
      const body = event.location ? `${minutesText} · ${event.location}` : minutesText;

      // Prefer the service worker — it survives backgrounded tabs and sleep
      // cycles better than an in-page setTimeout.
      if (hasSW) {
        postToSW({
          type: "schedule-reminder",
          key,
          fireAt,
          title: event.title,
          body,
          tag: `krowna-event-${event.id}`,
        });
        scheduled.set(key, { timerId: 0 as unknown as ReturnType<typeof setTimeout>, fireAt });
        continue;
      }

      // Fallback: in-page setTimeout for when no SW is available
      const timerId = setTimeout(() => {
        showNotification(event.title, {
          body,
          tag: `krowna-event-${event.id}`,
          requireInteraction: offset <= 5,
        });
        scheduled.delete(key);
      }, delay);

      scheduled.set(key, { timerId, fireAt });
    }
  }
}

export function clearAllReminders() {
  for (const { timerId } of scheduled.values()) clearTimeout(timerId);
  scheduled.clear();
  postToSW({ type: "clear-reminders" });
}

export function getScheduledCount(): number {
  return scheduled.size;
}
