import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We avoid jsdom (it has a CJS/ESM incompatibility on Node 21) and hand-stub
// the browser globals that src/lib/notifications.ts touches:
//   - globalThis.Notification (constructor + permission)
//   - globalThis.localStorage
//   - globalThis.navigator.serviceWorker
//   - globalThis.window

type MutableGlobal = Record<string, unknown>;

function installBrowserGlobals(permission: NotificationPermission = "granted") {
  const storage = new Map<string, string>();
  (globalThis as MutableGlobal).localStorage = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  };
  (globalThis as MutableGlobal).window = globalThis;
  (globalThis as MutableGlobal).Notification = Object.assign(
    vi.fn().mockImplementation(() => ({ onclick: null, close: vi.fn() })),
    { permission }
  );
  // Node 21's globalThis.navigator is a read-only getter — we can't reassign,
  // but it already exists and has no serviceWorker, so the SW path will
  // short-circuit and the in-page setTimeout fallback will run (which is
  // exactly what we want to test).
  return { storage };
}

function uninstallBrowserGlobals() {
  const g = globalThis as MutableGlobal;
  delete g.localStorage;
  delete g.window;
  delete g.Notification;
}

let notifications: typeof import("@/src/lib/notifications");

describe("scheduleEventReminders", () => {
  const NOW = new Date("2026-04-13T09:00:00Z").getTime();

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    installBrowserGlobals("granted");
    localStorage.setItem("krowna-notifications-enabled-v1", "1");

    vi.resetModules();
    notifications = await import("@/src/lib/notifications");
  });

  afterEach(() => {
    vi.useRealTimers();
    notifications.clearAllReminders();
    uninstallBrowserGlobals();
  });

  it("is a no-op when notifications are disabled", () => {
    localStorage.removeItem("krowna-notifications-enabled-v1");
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Standup",
        start_time: new Date(NOW + 30 * 60_000).toISOString(),
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(0);
  });

  it("schedules one reminder at start - 15min by default", () => {
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Standup",
        start_time: new Date(NOW + 60 * 60_000).toISOString(),
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(1);
  });

  it("schedules one reminder per offset when reminder_minutes has multiple values", () => {
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Big Meeting",
        start_time: new Date(NOW + 3 * 60 * 60_000).toISOString(),
        reminder_minutes: [60, 15, 5],
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(3);
  });

  it("ignores events whose reminder would fire in the past", () => {
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Starting soon",
        start_time: new Date(NOW + 5 * 60_000).toISOString(),
        reminder_minutes: [15], // would fire 10 min ago
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(0);
  });

  it("ignores events outside the 12h horizon", () => {
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Way later",
        start_time: new Date(NOW + 20 * 60 * 60_000).toISOString(),
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(0);
  });

  it("ignores already-started events", () => {
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "In progress",
        start_time: new Date(NOW - 30 * 60_000).toISOString(),
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(0);
  });

  it("replaces previously scheduled reminders on re-call", () => {
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "A",
        start_time: new Date(NOW + 60 * 60_000).toISOString(),
      },
      {
        id: "e2",
        title: "B",
        start_time: new Date(NOW + 90 * 60_000).toISOString(),
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(2);

    notifications.scheduleEventReminders([
      {
        id: "e3",
        title: "C",
        start_time: new Date(NOW + 120 * 60_000).toISOString(),
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(1);
  });

  it("fires the notification at the reminder time with correct body", () => {
    const NotificationSpy = (globalThis as MutableGlobal).Notification as unknown as ReturnType<typeof vi.fn>;

    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Team sync",
        start_time: new Date(NOW + 20 * 60_000).toISOString(),
        reminder_minutes: [10],
      },
    ]);

    vi.advanceTimersByTime(10 * 60_000);
    expect(NotificationSpy).toHaveBeenCalledWith(
      "Team sync",
      expect.objectContaining({ body: expect.stringContaining("in 10 min") })
    );
  });

  it("uses 'in 1 hour' label for 60-minute reminder", () => {
    const NotificationSpy = (globalThis as MutableGlobal).Notification as unknown as ReturnType<typeof vi.fn>;
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Big Mtg",
        start_time: new Date(NOW + 2 * 60 * 60_000).toISOString(),
        reminder_minutes: [60],
      },
    ]);
    vi.advanceTimersByTime(60 * 60_000);
    expect(NotificationSpy).toHaveBeenCalledWith(
      "Big Mtg",
      expect.objectContaining({ body: expect.stringContaining("in 1 hour") })
    );
  });

  it("includes location in notification body when provided", () => {
    const NotificationSpy = (globalThis as MutableGlobal).Notification as unknown as ReturnType<typeof vi.fn>;
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "Lunch",
        start_time: new Date(NOW + 30 * 60_000).toISOString(),
        reminder_minutes: [15],
        location: "Rosmarino",
      },
    ]);
    vi.advanceTimersByTime(15 * 60_000);
    expect(NotificationSpy).toHaveBeenCalledWith(
      "Lunch",
      expect.objectContaining({ body: expect.stringContaining("Rosmarino") })
    );
  });

  it("clearAllReminders cancels pending timers", () => {
    notifications.scheduleEventReminders([
      {
        id: "e1",
        title: "X",
        start_time: new Date(NOW + 30 * 60_000).toISOString(),
      },
    ]);
    expect(notifications.getScheduledCount()).toBe(1);
    notifications.clearAllReminders();
    expect(notifications.getScheduledCount()).toBe(0);
  });
});

describe("areNotificationsEnabled", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(() => {
    uninstallBrowserGlobals();
  });

  it("returns false when Notification API is missing", async () => {
    // No browser globals at all
    uninstallBrowserGlobals();
    const mod = await import("@/src/lib/notifications");
    expect(mod.areNotificationsEnabled()).toBe(false);
  });

  it("returns false when permission is not granted", async () => {
    installBrowserGlobals("default");
    localStorage.setItem("krowna-notifications-enabled-v1", "1");
    const mod = await import("@/src/lib/notifications");
    expect(mod.areNotificationsEnabled()).toBe(false);
  });

  it("returns false when user has not opted in even with permission", async () => {
    installBrowserGlobals("granted");
    // No localStorage flag
    const mod = await import("@/src/lib/notifications");
    expect(mod.areNotificationsEnabled()).toBe(false);
  });

  it("returns true when permission granted AND opted in", async () => {
    installBrowserGlobals("granted");
    localStorage.setItem("krowna-notifications-enabled-v1", "1");
    const mod = await import("@/src/lib/notifications");
    expect(mod.areNotificationsEnabled()).toBe(true);
  });
});

describe("setNotificationsEnabled", () => {
  beforeEach(() => {
    installBrowserGlobals("granted");
    vi.resetModules();
  });

  afterEach(() => {
    uninstallBrowserGlobals();
  });

  it("writes the flag when enabled", async () => {
    const mod = await import("@/src/lib/notifications");
    mod.setNotificationsEnabled(true);
    expect(localStorage.getItem("krowna-notifications-enabled-v1")).toBe("1");
  });

  it("removes the flag when disabled", async () => {
    localStorage.setItem("krowna-notifications-enabled-v1", "1");
    const mod = await import("@/src/lib/notifications");
    mod.setNotificationsEnabled(false);
    expect(localStorage.getItem("krowna-notifications-enabled-v1")).toBeNull();
  });
});
