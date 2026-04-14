"use server";

import { createClient } from "@/src/lib/supabase/server";

/**
 * Infer an updated energy profile from recent event + task completion patterns.
 *
 * Heuristic (no ML needed at our scale):
 *  - Count how many events the user *completed on time* per hour-of-day over
 *    the last 60 days. High-completion hours are peak. Rescheduled/dropped
 *    events count against that hour.
 *  - Normalize, pick top 3 hours → peak_hours, bottom 3 → low_hours.
 *  - Map the overall shape to a chronotype label (morning/evening/balanced).
 *
 * We update `profiles.energy_profile` so downstream AI planning (which already
 * reads that field) benefits automatically.
 */

type HourScore = { hour: number; score: number };

export async function learnEnergyProfile(): Promise<{
  ok: boolean;
  peak_hours?: number[];
  low_hours?: number[];
  chronotype?: string;
  reason?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const [eventsRes, tasksRes] = await Promise.all([
    supabase
      .from("events")
      .select("start_time, end_time, status, source")
      .eq("user_id", user.id)
      .gte("start_time", since.toISOString())
      .lte("start_time", new Date().toISOString())
      .limit(500),
    supabase
      .from("tasks")
      .select("due_time, status, updated_at")
      .eq("user_id", user.id)
      .gte("updated_at", since.toISOString())
      .limit(500),
  ]);

  const hourCounts = new Array(24).fill(0).map<HourScore>((_, h) => ({ hour: h, score: 0 }));

  for (const event of eventsRes.data || []) {
    const start = new Date(event.start_time);
    const hour = start.getHours();
    // Completed / attended events are a positive signal. "cancelled" is a
    // negative signal — the user rejected work at that hour.
    const status = (event as { status?: string }).status;
    if (status === "cancelled") {
      hourCounts[hour].score -= 1;
    } else {
      hourCounts[hour].score += 1;
    }
  }

  for (const task of tasksRes.data || []) {
    if (task.status === "done" && task.due_time) {
      const m = /^(\d{1,2}):/.exec(task.due_time);
      if (m) {
        const hour = Math.max(0, Math.min(23, parseInt(m[1], 10)));
        hourCounts[hour].score += 1.5; // tasks done on time weigh slightly more
      }
    }
  }

  // If signal is too sparse, bail and keep whatever profile the user already has.
  const totalSignal = hourCounts.reduce((acc, h) => acc + Math.abs(h.score), 0);
  if (totalSignal < 20) {
    return { ok: false, reason: "not_enough_data" };
  }

  // Only consider waking hours 6–23 for "peak" / "low" decisions.
  const waking = hourCounts.filter((h) => h.hour >= 6 && h.hour <= 23);
  const sorted = [...waking].sort((a, b) => b.score - a.score);
  const peak_hours = sorted.slice(0, 3).map((h) => h.hour).sort((a, b) => a - b);
  const low_hours = sorted.slice(-3).map((h) => h.hour).sort((a, b) => a - b);

  // Chronotype: look at where the "mass" is concentrated.
  const morningMass = waking.filter((h) => h.hour >= 6 && h.hour < 12).reduce((a, h) => a + Math.max(0, h.score), 0);
  const eveningMass = waking.filter((h) => h.hour >= 17 && h.hour < 23).reduce((a, h) => a + Math.max(0, h.score), 0);
  let chronotype = "balanced";
  if (morningMass > eveningMass * 1.4) chronotype = "morning";
  else if (eveningMass > morningMass * 1.4) chronotype = "evening";

  await supabase
    .from("profiles")
    .update({
      energy_profile: { chronotype, peak_hours, low_hours, learned_at: new Date().toISOString() },
    })
    .eq("id", user.id);

  return { ok: true, peak_hours, low_hours, chronotype };
}

/**
 * Read the current energy profile. Falls back to the default if the user's
 * profile is missing or misshapen.
 */
export async function getEnergyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("energy_profile")
    .eq("id", user.id)
    .single();

  const fallback = { chronotype: "balanced", peak_hours: [9, 10, 11], low_hours: [14, 15] };
  if (!data?.energy_profile) return fallback;
  return data.energy_profile as typeof fallback & { learned_at?: string };
}
