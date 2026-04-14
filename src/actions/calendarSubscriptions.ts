"use server";

import { createClient } from "@/src/lib/supabase/server";
import { parseIcs, normalizeIcsUrl } from "@/src/lib/ics";
import { revalidatePath } from "next/cache";

export type CalendarSubscription = {
  id: string;
  label: string;
  ics_url: string;
  color: string;
  provider: string;
  last_synced_at: string | null;
  last_sync_error: string | null;
  event_count: number;
  enabled: boolean;
  created_at: string;
};

export async function listSubscriptions(): Promise<CalendarSubscription[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("calendar_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data as CalendarSubscription[]) || [];
}

export async function addSubscription(input: {
  label: string;
  icsUrl: string;
  color?: string;
  provider?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };

  const normalizedUrl = normalizeIcsUrl(input.icsUrl);
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    return { ok: false as const, error: "URL must start with https:// or webcal://" };
  }

  const { data, error } = await supabase
    .from("calendar_subscriptions")
    .insert({
      user_id: user.id,
      label: input.label.trim() || "External calendar",
      ics_url: normalizedUrl,
      color: input.color || "#64748b",
      provider: input.provider || "ics",
    })
    .select()
    .single();

  if (error || !data) return { ok: false as const, error: error?.message || "insert failed" };

  // Kick off initial sync
  const syncResult = await syncSubscription(data.id);
  revalidatePath("/settings");
  return { ok: true as const, subscription: data as CalendarSubscription, sync: syncResult };
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase
    .from("calendar_subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Fetch the ICS feed, parse it, and upsert events into `events`. We tag every
 * event with `subscription_id` + `external_uid` so we can safely sweep deleted
 * events on each sync.
 */
export async function syncSubscription(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };

  const { data: sub } = await supabase
    .from("calendar_subscriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!sub) return { ok: false as const, error: "subscription not found" };

  let parsed: ReturnType<typeof parseIcs> = [];
  try {
    const res = await fetch(sub.ics_url, {
      headers: { Accept: "text/calendar, text/plain" },
      // Don't keep stale results around
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`);
    const text = await res.text();
    parsed = parseIcs(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    await supabase
      .from("calendar_subscriptions")
      .update({ last_sync_error: message, last_synced_at: new Date().toISOString() })
      .eq("id", id);
    return { ok: false as const, error: message };
  }

  // Limit to upcoming + recent past to keep the event table tidy
  const horizonPast = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const horizonFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const relevant = parsed.filter((e) => {
    const start = new Date(e.start);
    return start >= horizonPast && start <= horizonFuture;
  });

  // Upsert by (subscription_id, external_uid)
  const rows = relevant.map((e) => ({
    user_id: user.id,
    subscription_id: sub.id,
    external_uid: e.uid,
    title: e.title,
    description: e.description ?? null,
    location: e.location ?? null,
    start_time: e.start,
    end_time: e.end,
    color: sub.color,
    source: "subscription",
    all_day: e.allDay,
  }));

  if (rows.length) {
    await supabase.from("events").upsert(rows, {
      onConflict: "subscription_id,external_uid",
      ignoreDuplicates: false,
    });
  }

  // Sweep events that no longer appear in the feed
  const currentUids = new Set(relevant.map((e) => e.uid));
  const { data: existing } = await supabase
    .from("events")
    .select("id, external_uid")
    .eq("subscription_id", sub.id);
  const stale = (existing || []).filter((e) => e.external_uid && !currentUids.has(e.external_uid));
  if (stale.length) {
    await supabase
      .from("events")
      .delete()
      .in("id", stale.map((e) => e.id));
  }

  await supabase
    .from("calendar_subscriptions")
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
      event_count: rows.length,
    })
    .eq("id", sub.id);

  revalidatePath("/calendar");
  return { ok: true as const, added: rows.length, swept: stale.length };
}
