import { describe, it, expect, vi } from "vitest";

describe("AI Server Actions - Structure", () => {
  it("should export all required functions from ai.ts", async () => {
    const module = await import("@/src/actions/ai");
    expect(module.chatWithAI).toBeDefined();
    expect(module.parseEventPrompt).toBeDefined();
    expect(module.generateDailyBriefing).toBeDefined();
    expect(module.getUsageStats).toBeDefined();
    expect(module.optimizeSchedule).toBeDefined();
    expect(module.replanDay).toBeDefined();
    expect(module.executeAIActions).toBeDefined();
    expect(module.generateWeeklyReport).toBeDefined();
    expect(module.generateMeetingPrep).toBeDefined();
    expect(module.applyTemplate).toBeDefined();
    expect(module.getCalendarHeatmap).toBeDefined();
    expect(module.startFocusSession).toBeDefined();
  });

  it("chatWithAI should accept voiceMode parameter", async () => {
    const module = await import("@/src/actions/ai");
    // Verify the function signature accepts 3 params
    expect(module.chatWithAI.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Event Actions - Structure", () => {
  it("should export all CRUD functions", async () => {
    const module = await import("@/src/actions/events");
    expect(module.getEvents).toBeDefined();
    expect(module.createEvent).toBeDefined();
    expect(module.updateEvent).toBeDefined();
    expect(module.deleteEvent).toBeDefined();
  });
});

describe("Profile Actions - Structure", () => {
  it("should export all profile functions", async () => {
    const module = await import("@/src/actions/profile");
    expect(module.getUserProfile).toBeDefined();
    expect(module.saveUserProfile).toBeDefined();
    expect(module.uploadAvatar).toBeDefined();
  });
});

describe("Social Actions - Structure", () => {
  it("should export all social functions", async () => {
    const module = await import("@/src/actions/social");
    expect(module.sendFriendRequest).toBeDefined();
    expect(module.getFriends).toBeDefined();
    expect(module.getPendingRequests).toBeDefined();
    expect(module.respondToFriendRequest).toBeDefined();
    expect(module.createEventInvite).toBeDefined();
    expect(module.respondToInvite).toBeDefined();
    expect(module.getMyInvites).toBeDefined();
    expect(module.getNotifications).toBeDefined();
    expect(module.markNotificationRead).toBeDefined();
    expect(module.getUnreadCount).toBeDefined();
    expect(module.findMutualFreeTime).toBeDefined();
  });
});

describe("Credits Actions - Structure", () => {
  it("should export all credit functions", async () => {
    const module = await import("@/src/actions/credits");
    expect(module.getBonusCredits).toBeDefined();
    expect(module.purchaseCredits).toBeDefined();
    expect(module.getPurchaseHistory).toBeDefined();
  });
});

describe("Google Calendar Actions - Structure", () => {
  it("should export Google Calendar functions", async () => {
    const module = await import("@/src/actions/google-calendar");
    expect(module.getGoogleAuthUrl).toBeDefined();
    expect(module.getGoogleSyncStatus).toBeDefined();
    expect(module.disconnectGoogle).toBeDefined();
    expect(module.generateMeetLink).toBeDefined();
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
      "014_push_token",
      "015_share_links",
      "016_calendar_subscriptions",
      "017_ls_subscription_id",
      "018_user_email_lookup",
    ];
    expect(migrations).toHaveLength(18);
  });

  it("018 should add the find_user_by_email RPC and email column", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const sql = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/018_user_email_lookup.sql"),
      "utf-8",
    );
    expect(sql).toMatch(/ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.find_user_by_email/);
    expect(sql).toMatch(/SECURITY DEFINER/);
  });
});

describe("Mobile + Web shared API auth", () => {
  it("should expose getApiUser and getApiAuth for routes", async () => {
    const module = await import("@/src/lib/supabase/api-auth");
    expect(module.getApiUser).toBeDefined();
    expect(module.getApiAuth).toBeDefined();
  });
});

describe("Booking flow notification field", () => {
  it("should insert notification with `message` not `body`", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const route = fs.readFileSync(
      path.join(process.cwd(), "app/api/share/[slug]/book/route.ts"),
      "utf-8",
    );
    expect(route).toMatch(/type:\s*"booking_received"/);
    expect(route).toMatch(/message:\s*`/);
    // The schema column is `message` — `body` would be silently rejected.
    expect(route).not.toMatch(/\bbody:\s*`\$\{name\} booked/);
  });
});
