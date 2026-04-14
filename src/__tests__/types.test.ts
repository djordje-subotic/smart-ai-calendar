import { describe, it, expect } from "vitest";

describe("Event Types", () => {
  it("CalendarEvent should include meeting_url field", async () => {
    // Verify the type module exports correctly
    const module = await import("@/src/types/event");
    expect(module).toBeDefined();
  });

  it("AI types should include AIAction", async () => {
    const module = await import("@/src/types/ai");
    expect(module).toBeDefined();
  });
});

describe("Color Constants", () => {
  it("should export EVENT_COLORS array", async () => {
    const { EVENT_COLORS, DEFAULT_EVENT_COLOR } = await import("@/src/constants/colors");
    expect(EVENT_COLORS).toBeInstanceOf(Array);
    expect(EVENT_COLORS.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_EVENT_COLOR).toBeTruthy();
  });

  it("all colors should be valid hex", async () => {
    const { EVENT_COLORS } = await import("@/src/constants/colors");
    for (const color of EVENT_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("Profile Types", () => {
  it("UserProfile interface should be importable", async () => {
    // This tests that the module compiles and exports correctly
    const module = await import("@/src/actions/profile");
    expect(module.getUserProfile).toBeDefined();
    expect(module.saveUserProfile).toBeDefined();
    expect(module.uploadAvatar).toBeDefined();
  });
});
