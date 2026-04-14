"use client";

import { useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  areNotificationsEnabled,
  scheduleEventReminders,
  clearAllReminders,
  registerServiceWorker,
} from "@/src/lib/notifications";

/**
 * Drop this component into the dashboard layout. It watches for upcoming
 * events and schedules browser notifications so users get nudged before
 * meetings/focus blocks start. No-op if notifications are disabled.
 */
export function NotificationManager() {
  useEffect(() => {
    if (!areNotificationsEnabled()) return;

    // Register the service worker so reminders survive a backgrounded tab
    registerServiceWorker();

    let cancelled = false;
    const supabase = createClient();

    async function refresh() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const from = new Date().toISOString();
      const to = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

      const { data: events } = await supabase
        .from("events")
        .select("id, title, start_time, reminder_minutes, location")
        .eq("user_id", user.id)
        .gte("start_time", from)
        .lte("start_time", to)
        .order("start_time");

      if (!cancelled && events) {
        scheduleEventReminders(events);
      }
    }

    refresh();
    // Re-compute every 5 minutes so newly added events get picked up
    const interval = setInterval(refresh, 5 * 60 * 1000);

    // Re-check when the user returns to the tab (fresh data, re-scheduled)
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      clearAllReminders();
    };
  }, []);

  return null;
}
