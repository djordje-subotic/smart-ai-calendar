import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

describe("Habits — streak parity between web and mobile", () => {
  it("migration 019 defines a recompute_habit_streak helper", () => {
    const sql = readFile("supabase/migrations/019_habit_streak_trigger.sql");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.recompute_habit_streak");
    expect(sql).toContain("UPDATE habits");
    expect(sql).toContain("streak_current");
    expect(sql).toContain("streak_best");
  });

  it("migration 019 installs triggers on habit_completions for insert and delete", () => {
    const sql = readFile("supabase/migrations/019_habit_streak_trigger.sql");
    expect(sql).toContain("CREATE TRIGGER habit_completions_streak_aiu");
    expect(sql).toContain("AFTER INSERT OR UPDATE ON habit_completions");
    expect(sql).toContain("CREATE TRIGGER habit_completions_streak_ad");
    expect(sql).toContain("AFTER DELETE ON habit_completions");
  });

  it("mobile habits page refetches streak after toggling so the flame icon stays accurate", () => {
    const page = readFile("mobile/app/(tabs)/habits.tsx");
    expect(page).toContain('.from("habits")');
    expect(page).toContain("streak_current, streak_best");
    expect(page).toContain("setHabits");
  });

  it("web habits page no longer logs toggle results", () => {
    const page = readFile("app/(dashboard)/habits/page.tsx");
    expect(page).not.toContain('console.log("Toggle result:"');
  });
});
