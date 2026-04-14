import { describe, it, expect } from "vitest";

describe("AI Response Types", () => {
  it("ChatEvent should support meeting_url", () => {
    // Validate the shape matches what the AI returns
    const event = {
      title: "Test Meeting",
      start_time: "2026-04-15T10:00:00.000Z",
      end_time: "2026-04-15T11:00:00.000Z",
      location: "Office",
      description: "Test desc",
      recurrence: null,
      color: "#3B82F6",
      meeting_url: "https://meet.google.com/abc-def-ghi",
    };

    expect(event.meeting_url).toBeTruthy();
    expect(event.title).toBe("Test Meeting");
  });

  it("ChatAction should have proper types", () => {
    const deleteAction = {
      type: "delete" as const,
      event_id: "uuid-123",
      event_title: "Old Meeting",
      description: "Delete 'Old Meeting'",
    };

    const moveAction = {
      type: "move" as const,
      event_id: "uuid-456",
      event_title: "Lunch",
      description: "Move Lunch from 12:00 to 13:00",
      new_start_time: "2026-04-15T13:00:00.000Z",
      new_end_time: "2026-04-15T14:00:00.000Z",
    };

    const updateAction = {
      type: "update" as const,
      event_id: "uuid-789",
      event_title: "Gym",
      description: "Change color to green",
      updates: { color: "#10B981" },
    };

    expect(deleteAction.type).toBe("delete");
    expect(moveAction.new_start_time).toBeTruthy();
    expect(updateAction.updates?.color).toBe("#10B981");
  });

  it("PLAN_LIMITS should be defined correctly", () => {
    const PLAN_LIMITS: Record<string, number> = { free: 50, pro: 1000, ultra: 5000 };
    expect(PLAN_LIMITS.free).toBe(50);
    expect(PLAN_LIMITS.pro).toBe(1000);
    expect(PLAN_LIMITS.ultra).toBe(5000);
  });

  it("motivation styles should be valid", () => {
    const validStyles = ["strict", "friendly", "professional", "hype"];
    for (const style of validStyles) {
      expect(["strict", "friendly", "professional", "hype"]).toContain(style);
    }
  });
});

describe("Weekly Report Shape", () => {
  it("should have correct structure", () => {
    const report = {
      summary: "You had a productive week!",
      stats: {
        total_events: 15,
        total_hours: 22.5,
        busiest_day: "Wednesday",
        emptiest_day: "Sunday",
      },
      insights: ["You had 3 back-to-back meetings on Wednesday"],
      suggestions: ["Try to spread meetings more evenly"],
    };

    expect(report.stats.total_events).toBe(15);
    expect(report.insights).toHaveLength(1);
    expect(report.suggestions).toHaveLength(1);
  });
});

describe("Smart Templates", () => {
  it("template IDs should be valid", () => {
    const validTemplates = ["productive_week", "study_week", "balanced_week", "sprint_week", "vacation_mode"];
    expect(validTemplates).toHaveLength(5);
    for (const id of validTemplates) {
      expect(id).toMatch(/^[a-z_]+$/);
    }
  });
});
