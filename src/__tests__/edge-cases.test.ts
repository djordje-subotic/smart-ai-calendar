import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

describe("Edge Cases - Empty Data Handling", () => {
  it("calendar should handle zero events gracefully", () => {
    const schedule = readFile("mobile/src/components/calendar-views/ScheduleView.tsx");
    expect(schedule).toContain("No events");
  });

  it("today page should handle no events", () => {
    const today = readFile("app/(dashboard)/today/page.tsx");
    expect(today).toContain("No events today");
  });

  it("tasks panel should show empty state", () => {
    const tasks = readFile("src/components/tasks/TaskPanel.tsx");
    expect(tasks).toContain("No tasks yet");
  });

  it("habits screen should show empty state", () => {
    const habits = readFile("mobile/app/(tabs)/habits.tsx");
    expect(habits).toContain("No habits yet");
    expect(habits).toContain("ListEmptyComponent");
  });

  it("friends page should show empty state", () => {
    const friends = readFile("app/(dashboard)/friends/page.tsx");
    expect(friends).toContain("No friends yet");
  });

  it("AI chat should show suggestions when empty", () => {
    const ai = readFile("src/components/ai/AskAIDialog.tsx");
    expect(ai).toContain("How can I help");
  });

  it("weekly report should handle zero events", () => {
    const code = readFile("src/actions/ai.ts");
    expect(code).toContain("events?.length || 0");
  });

  it("calendar heatmap should handle no data", () => {
    const heatmap = readFile("src/components/calendar/CalendarHeatmap.tsx");
    expect(heatmap).toContain("No events");
  });
});

describe("Edge Cases - Error Handling", () => {
  it("AI chat should handle LIMIT_REACHED error", () => {
    const dialog = readFile("src/components/ai/AskAIDialog.tsx");
    expect(dialog).toContain("LIMIT_REACHED");
    expect(dialog).toContain("showCreditPurchase");
  });

  it("credit purchase should handle failed purchases", () => {
    const credits = readFile("src/components/ai/CreditPurchase.tsx");
    expect(credits).toContain("catch");
    expect(credits).toContain("Purchase failed");
  });

  it("event modal should validate times before submit", () => {
    const modal = readFile("src/components/calendar/EventModal.tsx");
    expect(modal).toContain("!startTime || !endTime");
  });

  it("avatar upload should handle failures", () => {
    const profile = readFile("app/(dashboard)/profile/page.tsx");
    expect(profile).toContain("Upload failed");
    expect(profile).toContain("catch");
  });

  it("Meet link generation should have try-catch-finally", () => {
    const modal = readFile("src/components/calendar/EventModal.tsx");
    expect(modal).toContain("Failed to generate Meet link");
    expect(modal).toContain("finally");
  });

  it("focus session should handle errors", () => {
    const focus = readFile("src/components/ai/FocusMode.tsx");
    expect(focus).toContain("catch");
  });

  it("smart templates should handle API failures", () => {
    const templates = readFile("src/components/ai/SmartTemplates.tsx");
    expect(templates).toContain("catch");
  });
});

describe("Edge Cases - Null Safety", () => {
  it("AI response results should have null coalescing", () => {
    const dialog = readFile("src/components/ai/AskAIDialog.tsx");
    expect(dialog).toContain("result.results || []");
  });

  it("actions should not use non-null assertions", () => {
    const dialog = readFile("src/components/ai/AskAIDialog.tsx");
    expect(dialog).toContain("msg.actions || []");
    expect(dialog).not.toContain("msg.actions!");
  });

  it("avatar preset should check for colon before split", () => {
    const profile = readFile("app/(dashboard)/profile/page.tsx");
    expect(profile).toContain('includes(":")');
  });

  it("DayView dragging should use null-safe checks", () => {
    const dayView = readFile("src/components/calendar/DayView.tsx");
    expect(dayView).not.toContain("dragging!");
    expect(dayView).toContain("isDragging && dragging ?");
  });

  it("WeekView dragging should use null-safe checks", () => {
    const weekView = readFile("src/components/calendar/WeekView.tsx");
    expect(weekView).not.toContain("dragging!");
    expect(weekView).toContain("isDragging && dragging ?");
  });

  it("API response content should use optional chaining", () => {
    const ai = readFile("src/actions/ai.ts");
    expect(ai).toContain("response.content?.[0]?.");
  });

  it("friends search should handle null fields", () => {
    const friends = readFile("app/(dashboard)/friends/page.tsx");
    // Check that all toLowerCase calls have null protection
    const searchSection = friends.split("const filtered")[1]?.split(": friends")[0] || "";
    expect(searchSection).toContain('|| ""');
  });
});

describe("Edge Cases - Security", () => {
  it("API key should not be exposed in client code", () => {
    const components = [
      "src/components/ai/AskAIDialog.tsx",
      "src/components/ai/HeyKrownaIndicator.tsx",
    ];
    for (const comp of components) {
      const code = readFile(comp);
      // Should not contain actual API key values
      expect(code).not.toContain("sk-ant-");
    }
    // AIInputBar references ANTHROPIC_API_KEY as error check string, not actual key
    const inputBar = readFile("src/components/ai/AIInputBar.tsx");
    expect(inputBar).not.toContain("sk-ant-");
  });

  it("auth middleware should protect dashboard routes", () => {
    const middleware = readFile("middleware.ts");
    expect(middleware).toContain("updateSession");
  });

  it("server actions should check authentication", () => {
    const actions = ["src/actions/events.ts", "src/actions/ai.ts", "src/actions/profile.ts"];
    for (const action of actions) {
      const code = readFile(action);
      expect(code).toContain("getUser");
      expect(code).toContain("Not authenticated");
    }
  });
});

describe("Edge Cases - Data Integrity", () => {
  it("social invite accept should check both event inserts", () => {
    const social = readFile("src/actions/social.ts");
    expect(social).toContain("orgErr");
    expect(social).toContain("invErr");
    expect(social).toContain("Failed to create events for both users");
  });

  it("credits should deduct correctly from bonus", () => {
    const ai = readFile("src/actions/ai.ts");
    expect(ai).toContain("bonusCredits - 1");
    expect(ai).toContain("usedBonus: true");
  });

  it("focus session should include all required event fields", () => {
    const ai = readFile("src/actions/ai.ts");
    const focusSection = ai.split("startFocusSession")[1] || "";
    expect(focusSection).toContain("meeting_url: null");
    expect(focusSection).toContain("external_id: null");
  });
});

describe("UI Interactions", () => {
  it("chat should reset credit purchase on clear", () => {
    const dialog = readFile("src/components/ai/AskAIDialog.tsx");
    expect(dialog).toContain("setShowCreditPurchase(false)");
    // Verify it's inside handleClear
    const clearSection = dialog.split("handleClear")[1]?.split("}")[0] || "";
    expect(clearSection).toContain("setShowCreditPurchase");
  });

  it("task panel should open modal for new tasks", () => {
    const tasks = readFile("src/components/tasks/TaskPanel.tsx");
    expect(tasks).toContain("Dialog");
    expect(tasks).toContain("showModal");
    expect(tasks).toContain("New Task");
  });

  it("mobile drawer should close on navigation", () => {
    const drawer = readFile("src/components/layout/MobileDrawer.tsx");
    expect(drawer).toContain("setMobileMenuOpen(false)");
  });

  it("profile panel should link to profile page", () => {
    const panel = readFile("src/components/profile/ProfilePanel.tsx");
    expect(panel).toContain('href="/profile"');
  });

  it("event card should show Join button for meeting URLs", () => {
    const card = readFile("src/components/calendar/EventCard.tsx");
    expect(card).toContain("meeting_url");
    expect(card).toContain("Join");
    expect(card).toContain("stopPropagation");
  });
});
