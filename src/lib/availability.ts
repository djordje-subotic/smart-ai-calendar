/**
 * Compute free slots for a share link, given the host's busy events.
 *
 * Pure function so it can run server-side without a DB round trip once you
 * have the link config and the busy windows.
 */

export type BusyWindow = { start: Date; end: Date };

export type AvailabilityOptions = {
  durationMinutes: number;
  daysAhead: number;
  earliestHour: number;
  latestHour: number;
  includeWeekends: boolean;
  /** IANA timezone, used only for display; computation stays in UTC. */
  now?: Date;
};

export type Slot = { start: string; end: string };

/**
 * Returns grouped slots keyed by YYYY-MM-DD (local to UTC for now — the UI
 * renders them in the viewer's tz via toLocaleString).
 */
export function computeAvailability(
  busy: BusyWindow[],
  opts: AvailabilityOptions
): Record<string, Slot[]> {
  const now = opts.now ?? new Date();
  const durationMs = opts.durationMinutes * 60_000;
  const slotStepMs = 30 * 60_000; // 30-min granularity

  const sortedBusy = [...busy].sort((a, b) => a.start.getTime() - b.start.getTime());

  const out: Record<string, Slot[]> = {};

  for (let day = 0; day < opts.daysAhead; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    date.setHours(opts.earliestHour, 0, 0, 0);

    const dow = date.getDay(); // 0 = Sun, 6 = Sat
    if (!opts.includeWeekends && (dow === 0 || dow === 6)) continue;

    const dayStart = date.getTime();
    const dayEnd = new Date(date).setHours(opts.latestHour, 0, 0, 0);

    for (let t = dayStart; t + durationMs <= dayEnd; t += slotStepMs) {
      // Past slots don't show up
      if (t < now.getTime()) continue;

      const slotStart = t;
      const slotEnd = t + durationMs;

      // Overlaps any busy window?
      const conflicts = sortedBusy.some(
        (b) => b.start.getTime() < slotEnd && b.end.getTime() > slotStart
      );
      if (conflicts) continue;

      const key = new Date(slotStart).toISOString().slice(0, 10);
      if (!out[key]) out[key] = [];
      out[key].push({
        start: new Date(slotStart).toISOString(),
        end: new Date(slotEnd).toISOString(),
      });
    }
  }

  return out;
}
