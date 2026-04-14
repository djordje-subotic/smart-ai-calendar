/**
 * Unit tests for the pure heuristic inside learnEnergyProfile.
 *
 * We can't easily test the full server action without mocking Supabase,
 * but the scoring logic is pure — we reimplement the exact algorithm here
 * so we can pin down behavior and catch regressions.
 */

import { describe, expect, it } from "vitest";

type Event = { start_time: string; status?: string };
type Task = { due_time: string | null; status: string };

/**
 * Mirror of the pure heuristic in src/actions/energy.ts — kept in sync
 * manually. Any change to the scoring algorithm should update both.
 */
function scoreHours(events: Event[], tasks: Task[]) {
  const hourCounts = new Array(24).fill(0).map((_, h) => ({ hour: h, score: 0 }));

  for (const event of events) {
    const hour = new Date(event.start_time).getUTCHours();
    if (event.status === "cancelled") hourCounts[hour].score -= 1;
    else hourCounts[hour].score += 1;
  }

  for (const task of tasks) {
    if (task.status === "done" && task.due_time) {
      const m = /^(\d{1,2}):/.exec(task.due_time);
      if (m) {
        const hour = Math.max(0, Math.min(23, parseInt(m[1], 10)));
        hourCounts[hour].score += 1.5;
      }
    }
  }

  return hourCounts;
}

function computePeakLow(hourScores: Array<{ hour: number; score: number }>) {
  const waking = hourScores.filter((h) => h.hour >= 6 && h.hour <= 23);
  const sorted = [...waking].sort((a, b) => b.score - a.score);
  const peak = sorted.slice(0, 3).map((h) => h.hour).sort((a, b) => a - b);
  const low = sorted.slice(-3).map((h) => h.hour).sort((a, b) => a - b);
  return { peak, low };
}

function classifyChronotype(hourScores: Array<{ hour: number; score: number }>) {
  const waking = hourScores.filter((h) => h.hour >= 6 && h.hour <= 23);
  const morning = waking
    .filter((h) => h.hour >= 6 && h.hour < 12)
    .reduce((a, h) => a + Math.max(0, h.score), 0);
  const evening = waking
    .filter((h) => h.hour >= 17 && h.hour < 23)
    .reduce((a, h) => a + Math.max(0, h.score), 0);
  if (morning > evening * 1.4) return "morning";
  if (evening > morning * 1.4) return "evening";
  return "balanced";
}

describe("energy heuristic: hour scoring", () => {
  it("gives +1 to each attended event hour", () => {
    const scores = scoreHours(
      [
        { start_time: "2026-04-13T09:00:00Z" },
        { start_time: "2026-04-13T09:30:00Z" },
        { start_time: "2026-04-13T14:00:00Z" },
      ],
      []
    );
    expect(scores[9].score).toBe(2);
    expect(scores[14].score).toBe(1);
    expect(scores[10].score).toBe(0);
  });

  it("gives -1 to cancelled event hours", () => {
    const scores = scoreHours(
      [{ start_time: "2026-04-13T09:00:00Z", status: "cancelled" }],
      []
    );
    expect(scores[9].score).toBe(-1);
  });

  it("weights done tasks at +1.5 at their due hour", () => {
    const scores = scoreHours(
      [],
      [
        { due_time: "10:00", status: "done" },
        { due_time: "10:30", status: "done" },
      ]
    );
    expect(scores[10].score).toBe(3);
  });

  it("ignores tasks that aren't done", () => {
    const scores = scoreHours(
      [],
      [{ due_time: "10:00", status: "open" }]
    );
    expect(scores[10].score).toBe(0);
  });

  it("ignores tasks without due_time", () => {
    const scores = scoreHours(
      [],
      [{ due_time: null, status: "done" }]
    );
    const total = scores.reduce((acc, h) => acc + h.score, 0);
    expect(total).toBe(0);
  });

  it("clamps task hour to 0-23 on malformed input", () => {
    const scores = scoreHours(
      [],
      [{ due_time: "25:00", status: "done" }]
    );
    expect(scores[23].score).toBe(1.5);
  });
});

describe("energy heuristic: peak/low extraction", () => {
  it("picks the 3 highest-scoring waking hours as peak", () => {
    const events: Event[] = [];
    // Seed specific hours
    for (let i = 0; i < 5; i++) events.push({ start_time: "2026-04-13T09:00:00Z" });
    for (let i = 0; i < 3; i++) events.push({ start_time: "2026-04-13T10:00:00Z" });
    for (let i = 0; i < 4; i++) events.push({ start_time: "2026-04-13T11:00:00Z" });
    for (let i = 0; i < 1; i++) events.push({ start_time: "2026-04-13T14:00:00Z" });

    const scores = scoreHours(events, []);
    const { peak } = computePeakLow(scores);
    expect(peak).toEqual([9, 10, 11]);
  });

  it("excludes night hours (0-5) from peak/low calculation", () => {
    const scores = scoreHours(
      [
        { start_time: "2026-04-13T03:00:00Z" }, // 3am — should be excluded
      ],
      []
    );
    const { peak } = computePeakLow(scores);
    expect(peak).not.toContain(3);
  });

  it("returns sorted peak hours (ascending)", () => {
    const events = [
      { start_time: "2026-04-13T18:00:00Z" },
      { start_time: "2026-04-13T09:00:00Z" },
      { start_time: "2026-04-13T14:00:00Z" },
    ];
    const scores = scoreHours(events, []);
    const { peak } = computePeakLow(scores);
    expect(peak).toEqual([...peak].sort((a, b) => a - b));
  });
});

describe("energy heuristic: chronotype classification", () => {
  it("labels morning when morning mass > 1.4× evening", () => {
    const scores = scoreHours(
      [
        { start_time: "2026-04-13T07:00:00Z" },
        { start_time: "2026-04-13T08:00:00Z" },
        { start_time: "2026-04-13T08:00:00Z" },
        { start_time: "2026-04-13T09:00:00Z" },
        { start_time: "2026-04-13T10:00:00Z" },
        { start_time: "2026-04-13T18:00:00Z" },
      ],
      []
    );
    expect(classifyChronotype(scores)).toBe("morning");
  });

  it("labels evening when evening mass > 1.4× morning", () => {
    const scores = scoreHours(
      [
        { start_time: "2026-04-13T08:00:00Z" },
        { start_time: "2026-04-13T18:00:00Z" },
        { start_time: "2026-04-13T19:00:00Z" },
        { start_time: "2026-04-13T20:00:00Z" },
        { start_time: "2026-04-13T21:00:00Z" },
        { start_time: "2026-04-13T22:00:00Z" },
      ],
      []
    );
    expect(classifyChronotype(scores)).toBe("evening");
  });

  it("labels balanced when mass is close", () => {
    const scores = scoreHours(
      [
        { start_time: "2026-04-13T08:00:00Z" },
        { start_time: "2026-04-13T09:00:00Z" },
        { start_time: "2026-04-13T18:00:00Z" },
        { start_time: "2026-04-13T19:00:00Z" },
      ],
      []
    );
    expect(classifyChronotype(scores)).toBe("balanced");
  });
});
