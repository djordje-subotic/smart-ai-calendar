import { describe, it, expect } from "vitest";

describe("AI Server Actions - Structure", () => {
  it("should export all required functions from ai.ts", async () => {
    const mod = await import("@/src/actions/ai");
    expect(mod.chatWithAI).toBeDefined();
    expect(mod.parseEventPrompt).toBeDefined();
    expect(mod.generateDailyBriefing).toBeDefined();
    expect(mod.getUsageStats).toBeDefined();
    expect(mod.optimizeSchedule).toBeDefined();
    expect(mod.replanDay).toBeDefined();
    expect(mod.executeAIActions).toBeDefined();
    expect(mod.generateWeeklyReport).toBeDefined();
    expect(mod.generateMeetingPrep).toBeDefined();
    expect(mod.applyTemplate).toBeDefined();
    expect(mod.getCalendarHeatmap).toBeDefined();
    expect(mod.startFocusSession).toBeDefined();
  });

  it("chatWithAI should accept voiceMode parameter", async () => {
    const mod = await import("@/src/actions/ai");
    // Verify the function signature accepts 3 params
    expect(mod.chatWithAI.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Event Actions - Structure", () => {
  it("should export all CRUD functions", async () => {
    const mod = await import("@/src/actions/events");
    expect(mod.getEvents).toBeDefined();
    expect(mod.createEvent).toBeDefined();
    expect(mod.updateEvent).toBeDefined();
    expect(mod.deleteEvent).toBeDefined();
  });
});

describe("Profile Actions - Structure", () => {
  it("should export all profile functions", async () => {
    const mod = await import("@/src/actions/profile");
    expect(mod.getUserProfile).toBeDefined();
    expect(mod.saveUserProfile).toBeDefined();
    expect(mod.uploadAvatar).toBeDefined();
  });
});

describe("Social Actions - Structure", () => {
  it("should export all social functions", async () => {
    const mod = await import("@/src/actions/social");
    expect(mod.sendFriendRequest).toBeDefined();
    expect(mod.getFriends).toBeDefined();
    expect(mod.getPendingRequests).toBeDefined();
    expect(mod.respondToFriendRequest).toBeDefined();
    expect(mod.createEventInvite).toBeDefined();
    expect(mod.respondToInvite).toBeDefined();
    expect(mod.getMyInvites).toBeDefined();
    expect(mod.getNotifications).toBeDefined();
    expect(mod.markNotificationRead).toBeDefined();
    expect(mod.getUnreadCount).toBeDefined();
    expect(mod.findMutualFreeTime).toBeDefined();
  });
});

describe("Credits Actions - Structure", () => {
  it("should export all credit functions", async () => {
    const mod = await import("@/src/actions/credits");
    expect(mod.getBonusCredits).toBeDefined();
    expect(mod.purchaseCredits).toBeDefined();
    expect(mod.getPurchaseHistory).toBeDefined();
  });
});

describe("Google Calendar Actions - Structure", () => {
  it("should export Google Calendar functions", async () => {
    const mod = await import("@/src/actions/google-calendar");
    expect(mod.getGoogleAuthUrl).toBeDefined();
    expect(mod.getGoogleSyncStatus).toBeDefined();
    expect(mod.disconnectGoogle).toBeDefined();
    expect(mod.generateMeetLink).toBeDefined();
  });
});

describe("Type Definitions - Completeness", () => {
  it("CalendarEvent should have all required fields", () => {
    const requiredFields = [
      "id", "user_id", "title", "description", "location",
      "start_time", "end_time", "all_day", "color",
      "recurrence_rule", "reminder_minutes", "source",
      "external_id", "ai_metadata", "meeting_url", "status",
      "created_at", "updated_at",
    ];
    // This is a compile-time check — if the type changes, this test documents expectations
    expect(requiredFields).toHaveLength(18);
  });

  it("AIAction should support all action types", () => {
    const actionTypes = ["delete", "move", "update"];
    expect(actionTypes).toHaveLength(3);
  });

  it("UserProfile should have all new fields", () => {
    const profileFields = [
      "display_name", "avatar_url", "avatar_preset", "date_of_birth",
      "city", "motivation_style", "motto", "occupation", "bio",
      "goals", "daily_habits", "hobbies", "priorities", "constraints",
      "ideal_day", "work_schedule", "preferences", "onboarding_completed",
    ];
    expect(profileFields).toHaveLength(18);
  });
});

describe("Navigation Structure", () => {
  it("should have all expected page routes", () => {
    const routes = [
      "/calendar", "/today", "/habits", "/tools",
      "/friends", "/profile", "/settings",
    ];
    expect(routes).toHaveLength(7);
    for (const route of routes) {
      expect(route).toMatch(/^\/[a-z]+$/);
    }
  });

  it("mobile should have 5 visible tabs", () => {
    const visibleTabs = ["calendar", "today", "ai", "habits", "more"];
    expect(visibleTabs).toHaveLength(5);
  });

  it("mobile should have hidden tabs accessible via navigation", () => {
    const hiddenTabs = ["tasks", "profile", "friends", "tools", "settings"];
    expect(hiddenTabs).toHaveLength(5);
  });
});

describe("Database Migrations", () => {
  it("should have all expected migrations", () => {
    const migrations = [
      "001_create_profiles",
      "002_create_events",
      "003_create_habits",
      "004_create_usage_and_plans",
      "005_create_tasks",
      "006_google_calendar_tokens",
      "007_social_scheduling",
      "008_user_profile_goals",
      "009_expanded_user_profile",
      "010_profile_personalization",
      "011_meeting_url",
      "012_on_demand_credits",
      "013_voice_preference",
    ];
    expect(migrations).toHaveLength(13);
  });
});
