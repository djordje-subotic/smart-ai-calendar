/**
 * Native Apple / system calendar integration via expo-calendar.
 *
 * On iOS this reads from EventKit (covers Apple Calendar, iCloud, Gmail,
 * Outlook, and any other CalDAV source the user has added in Settings).
 * On Android it talks to the system Calendar Provider (Google, Samsung,
 * any configured account).
 *
 * We only READ from the native calendar and mirror events into Kron with a
 * `source: "device"` tag. Writing back is intentionally kept out of scope —
 * that would fight Google Calendar sync when both are enabled.
 */

import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export type NativeCalendar = {
  id: string;
  title: string;
  color: string;
  source: string;
  allowsModifications: boolean;
};

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

export async function listNativeCalendars(): Promise<NativeCalendar[]> {
  const granted = await requestCalendarPermission();
  if (!granted) return [];

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.map((c) => ({
    id: c.id,
    title: c.title,
    color: c.color || "#64748b",
    source: typeof c.source === "object" ? c.source.name : String(c.source || ""),
    allowsModifications: c.allowsModifications,
  }));
}

/**
 * Pull events from the native calendar over a reasonable window (30 days
 * back, 90 days ahead) and upsert them into Kron. Returns the number of
 * events synced.
 */
export async function syncNativeCalendar(
  calendarIds: string[],
  options: { daysBack?: number; daysAhead?: number } = {}
): Promise<{ ok: boolean; synced: number; error?: string }> {
  try {
    const granted = await requestCalendarPermission();
    if (!granted) return { ok: false, synced: 0, error: "permission_denied" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, synced: 0, error: "unauthenticated" };

    const daysBack = options.daysBack ?? 30;
    const daysAhead = options.daysAhead ?? 90;
    const from = new Date(Date.now() - daysBack * 86_400_000);
    const to = new Date(Date.now() + daysAhead * 86_400_000);

    const events = await Calendar.getEventsAsync(calendarIds, from, to);

    const rows = events
      .filter((e) => e.startDate && e.endDate)
      .map((e) => ({
        user_id: user.id,
        external_uid: `${Platform.OS}:${e.id}`,
        title: e.title || "(no title)",
        description: e.notes ?? null,
        location: e.location ?? null,
        start_time: new Date(e.startDate as string | number).toISOString(),
        end_time: new Date(e.endDate as string | number).toISOString(),
        color: "#64748b",
        source: "device",
        all_day: e.allDay || false,
      }));

    if (rows.length) {
      // Upsert by external_uid so re-syncs don't create duplicates.
      await supabase.from("events").upsert(rows, {
        onConflict: "user_id,external_uid",
        ignoreDuplicates: false,
      });
    }

    return { ok: true, synced: rows.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "sync failed";
    return { ok: false, synced: 0, error: message };
  }
}

/**
 * Remove device-sourced events that were previously synced. Useful when the
 * user disables the integration.
 */
export async function clearSyncedNativeEvents() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("events")
    .delete()
    .eq("user_id", user.id)
    .eq("source", "device");
}
