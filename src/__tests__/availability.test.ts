import { describe, expect, it } from "vitest";
import { computeAvailability, type BusyWindow } from "@/src/lib/availability";

// Fixed reference time — a Monday at 08:00 UTC, well before any slot window.
const MON_0800 = new Date("2026-04-13T08:00:00Z");

function countSlots(out: Record<string, Array<{ start: string; end: string }>>) {
  return Object.values(out).reduce((acc, slots) => acc + slots.length, 0);
}

describe("computeAvailability", () => {
  it("produces slots only within the earliest/latest window", () => {
    const out = computeAvailability([], {
      durationMinutes: 30,
      daysAhead: 1, // today only
      earliestHour: 9,
      latestHour: 11, // 2-hour window
      includeWeekends: false,
      now: MON_0800,
    });

    const slots = Object.values(out).flat();
    for (const s of slots) {
      const hour = new Date(s.start).getHours();
      expect(hour).toBeGreaterThanOrEqual(9);
      expect(hour).toBeLessThan(11);
    }
  });

  it("respects the durationMinutes field", () => {
    const out = computeAvailability([], {
      durationMinutes: 60,
      daysAhead: 1,
      earliestHour: 9,
      latestHour: 11,
      includeWeekends: false,
      now: MON_0800,
    });
    const slots = Object.values(out).flat();
    for (const s of slots) {
      const durationMs = new Date(s.end).getTime() - new Date(s.start).getTime();
      expect(durationMs).toBe(60 * 60_000);
    }
  });

  it("omits slots that overlap busy windows", () => {
    // availability.ts uses local time for slot boundaries; construct busy
    // window in local time too so the overlap is real regardless of TZ.
    const day = new Date(MON_0800);
    const busyStart = new Date(day);
    busyStart.setHours(9, 0, 0, 0);
    const busyEnd = new Date(day);
    busyEnd.setHours(10, 0, 0, 0);

    const busy: BusyWindow[] = [{ start: busyStart, end: busyEnd }];

    const out = computeAvailability(busy, {
      durationMinutes: 30,
      daysAhead: 1,
      earliestHour: 9,
      latestHour: 11,
      includeWeekends: false,
      now: MON_0800,
    });

    const slots = Object.values(out).flat();
    // Any slot that overlaps the 9-10 busy window should be gone; 10:00 and 10:30 allowed
    for (const s of slots) {
      const start = new Date(s.start).getHours() * 60 + new Date(s.start).getMinutes();
      expect(start).toBeGreaterThanOrEqual(10 * 60);
    }
  });

  it("skips weekends when includeWeekends is false", () => {
    // Range covers Fri/Sat/Sun starting from a Friday
    const friday = new Date("2026-04-17T08:00:00Z");
    const out = computeAvailability([], {
      durationMinutes: 60,
      daysAhead: 3,
      earliestHour: 9,
      latestHour: 17,
      includeWeekends: false,
      now: friday,
    });

    const daysWithSlots = Object.keys(out);
    // Friday has slots; Saturday and Sunday should be absent
    expect(daysWithSlots).toContain("2026-04-17");
    expect(daysWithSlots).not.toContain("2026-04-18"); // Saturday
    expect(daysWithSlots).not.toContain("2026-04-19"); // Sunday
  });

  it("includes weekends when includeWeekends is true", () => {
    const friday = new Date("2026-04-17T08:00:00Z");
    const out = computeAvailability([], {
      durationMinutes: 60,
      daysAhead: 3,
      earliestHour: 9,
      latestHour: 17,
      includeWeekends: true,
      now: friday,
    });

    const daysWithSlots = Object.keys(out);
    expect(daysWithSlots).toContain("2026-04-18");
    expect(daysWithSlots).toContain("2026-04-19");
  });

  it("excludes slots in the past", () => {
    // now is 10:30 — 09:00 and 10:00 slots should not appear
    const now = new Date("2026-04-13T10:30:00Z");
    const out = computeAvailability([], {
      durationMinutes: 30,
      daysAhead: 1,
      earliestHour: 9,
      latestHour: 12,
      includeWeekends: false,
      now,
    });

    const slots = Object.values(out).flat();
    for (const s of slots) {
      expect(new Date(s.start).getTime()).toBeGreaterThanOrEqual(now.getTime());
    }
  });

  it("groups slots by YYYY-MM-DD key", () => {
    const out = computeAvailability([], {
      durationMinutes: 60,
      daysAhead: 2,
      earliestHour: 9,
      latestHour: 10,
      includeWeekends: false,
      now: MON_0800, // Monday
    });

    for (const key of Object.keys(out)) {
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("produces 30-minute granular start times", () => {
    const out = computeAvailability([], {
      durationMinutes: 60,
      daysAhead: 1,
      earliestHour: 9,
      latestHour: 13,
      includeWeekends: false,
      now: MON_0800,
    });

    const slots = Object.values(out).flat();
    for (const s of slots) {
      const min = new Date(s.start).getMinutes();
      expect([0, 30]).toContain(min);
    }
  });

  it("handles a fully-booked day gracefully (no slots)", () => {
    const busy: BusyWindow[] = [
      {
        start: new Date("2026-04-13T00:00:00Z"),
        end: new Date("2026-04-14T00:00:00Z"),
      },
    ];
    const out = computeAvailability(busy, {
      durationMinutes: 30,
      daysAhead: 1,
      earliestHour: 9,
      latestHour: 17,
      includeWeekends: false,
      now: MON_0800,
    });
    expect(countSlots(out)).toBe(0);
  });

  it("returns empty object when daysAhead is 0", () => {
    const out = computeAvailability([], {
      durationMinutes: 30,
      daysAhead: 0,
      earliestHour: 9,
      latestHour: 17,
      includeWeekends: false,
      now: MON_0800,
    });
    expect(Object.keys(out)).toHaveLength(0);
  });
});
