import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const MOBILE = "mobile/app";

function readFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

function fileExists(path: string): boolean {
  return existsSync(join(process.cwd(), path));
}

describe("Mobile App - File Structure", () => {
  const requiredFiles = [
    `${MOBILE}/_layout.tsx`,
    `${MOBILE}/index.tsx`,
    `${MOBILE}/(auth)/_layout.tsx`,
    `${MOBILE}/(auth)/login.tsx`,
    `${MOBILE}/(auth)/register.tsx`,
    `${MOBILE}/(tabs)/_layout.tsx`,
    `${MOBILE}/(tabs)/calendar.tsx`,
    `${MOBILE}/(tabs)/today.tsx`,
    `${MOBILE}/(tabs)/ai.tsx`,
    `${MOBILE}/(tabs)/habits.tsx`,
    `${MOBILE}/(tabs)/tasks.tsx`,
    `${MOBILE}/(tabs)/profile.tsx`,
    `${MOBILE}/(tabs)/friends.tsx`,
    `${MOBILE}/(tabs)/tools.tsx`,
    `${MOBILE}/(tabs)/more.tsx`,
    `${MOBILE}/(tabs)/settings.tsx`,
  ];

  for (const file of requiredFiles) {
    it(`should have ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }
});

describe("Mobile App - Tab Navigation", () => {
  it("should have 5 visible tabs", () => {
    const layout = readFile(`${MOBILE}/(tabs)/_layout.tsx`);
    const visibleTabs = layout.match(/tabBarIcon.*?TabIcon/g);
    expect(visibleTabs).toHaveLength(5);
  });

  it("should hide extra tabs from tab bar", () => {
    const layout = readFile(`${MOBILE}/(tabs)/_layout.tsx`);
    expect(layout).toContain("href: null");
    // Count hidden tabs
    const hiddenCount = (layout.match(/href: null/g) || []).length;
    expect(hiddenCount).toBe(5); // tasks, profile, friends, tools, settings
  });

  it("visible tabs should be: calendar, today, ai, habits, more", () => {
    const layout = readFile(`${MOBILE}/(tabs)/_layout.tsx`);
    expect(layout).toContain('"Calendar"');
    expect(layout).toContain('"Today"');
    expect(layout).toContain("Kron AI");
    expect(layout).toContain('"Habits"');
    expect(layout).toContain('"More"');
  });
});

describe("Mobile App - Auth Flow", () => {
  it("login should use Supabase signIn", () => {
    const login = readFile(`${MOBILE}/(auth)/login.tsx`);
    expect(login).toContain("signIn");
    expect(login).toContain("email");
    expect(login).toContain("password");
  });

  it("register should validate password length", () => {
    const register = readFile(`${MOBILE}/(auth)/register.tsx`);
    expect(register).toContain("password.length < 6");
  });

  it("login should redirect to calendar on success", () => {
    const login = readFile(`${MOBILE}/(auth)/login.tsx`);
    expect(login).toContain("/(tabs)/calendar");
  });

  it("register should show free plan features", () => {
    const register = readFile(`${MOBILE}/(auth)/register.tsx`);
    expect(register).toContain("30 AI requests");
    expect(register).toContain("Free forever");
  });

  it("login should have Kron branding", () => {
    const login = readFile(`${MOBILE}/(auth)/login.tsx`);
    expect(login).toContain("kron");
    expect(login).toContain("RULE YOUR TIME");
  });
});

describe("Mobile App - Calendar", () => {
  it("should fetch events from Supabase", () => {
    const cal = readFile(`${MOBILE}/(tabs)/calendar.tsx`);
    expect(cal).toContain("supabase");
    expect(cal).toContain(".from(\"events\")");
  });

  it("should include meeting_url in event query", () => {
    const cal = readFile(`${MOBILE}/(tabs)/calendar.tsx`);
    expect(cal).toContain("meeting_url");
  });

  it("should show video call indicator", () => {
    const cal = readFile(`${MOBILE}/(tabs)/calendar.tsx`);
    expect(cal).toContain("meeting_url");
  });

  it("should show AI source indicator", () => {
    // AI indicator moved to sub-view components
    const schedule = readFile("mobile/src/components/calendar-views/ScheduleView.tsx");
    expect(schedule).toContain('source === "ai"');
  });

  it("should have month navigation", () => {
    const cal = readFile(`${MOBILE}/(tabs)/calendar.tsx`);
    expect(cal).toContain("addMonths");
    expect(cal).toContain("subMonths");
  });
});

describe("Mobile App - AI Chat", () => {
  it("should call web API for AI", () => {
    const ai = readFile(`${MOBILE}/(tabs)/ai.tsx`);
    expect(ai).toContain("API_URL");
    expect(ai).toContain("/api/ai/chat");
  });

  it("should have fallback for offline/error", () => {
    const ai = readFile(`${MOBILE}/(tabs)/ai.tsx`);
    expect(ai).toContain("Fallback");
    expect(ai).toContain("insertErr");
  });

  it("should show suggestion chips", () => {
    const ai = readFile(`${MOBILE}/(tabs)/ai.tsx`);
    expect(ai).toContain("SUGGESTIONS");
    expect(ai).toContain("Plan my productive day");
  });

  it("should show event cards with Add All button", () => {
    const ai = readFile(`${MOBILE}/(tabs)/ai.tsx`);
    expect(ai).toContain("Add all");
    expect(ai).toContain("handleAddAllEvents");
  });

  it("should show action cards", () => {
    const ai = readFile(`${MOBILE}/(tabs)/ai.tsx`);
    expect(ai).toContain("ChatAction");
    expect(ai).toContain("delete");
    expect(ai).toContain("move");
    expect(ai).toContain("update");
  });

  it("should have clear chat button", () => {
    const ai = readFile(`${MOBILE}/(tabs)/ai.tsx`);
    expect(ai).toContain("setMessages([])");
    expect(ai).toContain("Clear");
  });
});

describe("Mobile App - Profile", () => {
  it("should have all profile fields", () => {
    const profile = readFile(`${MOBILE}/(tabs)/profile.tsx`);
    expect(profile).toContain("displayName");
    expect(profile).toContain("occupation");
    expect(profile).toContain("bio");
    expect(profile).toContain("city");
    expect(profile).toContain("motto");
    expect(profile).toContain("goals");
    expect(profile).toContain("habits");
  });

  it("should have chip selectors for goals and habits", () => {
    const profile = readFile(`${MOBILE}/(tabs)/profile.tsx`);
    expect(profile).toContain("GOALS");
    expect(profile).toContain("HABITS");
    expect(profile).toContain("ChipSection");
  });

  it("should save to Supabase", () => {
    const profile = readFile(`${MOBILE}/(tabs)/profile.tsx`);
    expect(profile).toContain(".update(");
    expect(profile).toContain("onboarding_completed: true");
  });
});

describe("Mobile App - Tools", () => {
  it("should have focus mode with duration options", () => {
    const tools = readFile(`${MOBILE}/(tabs)/tools.tsx`);
    expect(tools).toContain("FOCUS_DURATIONS");
    expect(tools).toContain("25m");
    expect(tools).toContain("90m");
    expect(tools).toContain("Focus Block");
  });

  it("should have smart templates", () => {
    const tools = readFile(`${MOBILE}/(tabs)/tools.tsx`);
    expect(tools).toContain("TEMPLATES");
    expect(tools).toContain("productive_week");
    expect(tools).toContain("study_week");
    expect(tools).toContain("vacation_mode");
  });

  it("templates should call API", () => {
    const tools = readFile(`${MOBILE}/(tabs)/tools.tsx`);
    expect(tools).toContain("API_URL");
    expect(tools).toContain("/api/ai/chat");
  });
});

describe("Mobile App - More Hub", () => {
  it("should link to all sub-pages", () => {
    const more = readFile(`${MOBILE}/(tabs)/more.tsx`);
    expect(more).toContain("/(tabs)/profile");
    expect(more).toContain("/(tabs)/tasks");
    expect(more).toContain("/(tabs)/friends");
    expect(more).toContain("/(tabs)/tools");
    expect(more).toContain("/(tabs)/settings");
  });

  it("should show AI usage stats", () => {
    const more = readFile(`${MOBILE}/(tabs)/more.tsx`);
    expect(more).toContain("ai_credits_used");
    expect(more).toContain("bonus_credits");
  });

  it("should have sign out", () => {
    const more = readFile(`${MOBILE}/(tabs)/more.tsx`);
    expect(more).toContain("signOut");
    expect(more).toContain("Sign out");
  });

  it("sign out should have error handling", () => {
    const more = readFile(`${MOBILE}/(tabs)/more.tsx`);
    expect(more).toContain("try");
    expect(more).toContain("catch");
  });
});

describe("Mobile App - Settings", () => {
  it("should show credit purchase button", () => {
    const settings = readFile(`${MOBILE}/(tabs)/settings.tsx`);
    expect(settings).toContain("CreditPurchaseModal");
    expect(settings).toContain("Buy extra credits");
    // Actual packages are in the modal
    const modal = readFile(`${MOBILE.replace("app", "src/components")}/CreditPurchaseModal.tsx`);
    expect(modal).toContain("$2.99");
    expect(modal).toContain("$5.99");
    expect(modal).toContain("$14.99");
  });

  it("should show plan tiers", () => {
    const settings = readFile(`${MOBILE}/(tabs)/settings.tsx`);
    expect(settings).toContain("Free");
    expect(settings).toContain("Pro");
    expect(settings).toContain("Ultra");
  });

  it("should link to profile edit", () => {
    const settings = readFile(`${MOBILE}/(tabs)/settings.tsx`);
    expect(settings).toContain("/(tabs)/profile");
  });
});

describe("Mobile App - Consistent Theming", () => {
  it("all screens should use colors constant", () => {
    const screens = [
      "calendar", "today", "ai", "habits", "tasks",
      "profile", "friends", "tools", "more", "settings",
    ];
    for (const screen of screens) {
      const code = readFile(`${MOBILE}/(tabs)/${screen}.tsx`);
      expect(code).toContain("colors.background");
      expect(code).toContain("colors.foreground");
    }
  });

  it("all screens should use SafeAreaView", () => {
    const screens = ["calendar", "today", "ai", "habits", "tasks", "profile", "friends", "tools", "more", "settings"];
    for (const screen of screens) {
      const code = readFile(`${MOBILE}/(tabs)/${screen}.tsx`);
      expect(code).toContain("SafeAreaView");
    }
  });
});
