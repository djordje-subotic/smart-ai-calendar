import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf-8");
}

describe("Landing Page", () => {
  it("should have 12 features", () => {
    const landing = readFile("src/components/layout/LandingPage.tsx");
    // Match both `{ icon:` (single-line) and `{\n    icon:` (formatted)
    const featureMatches = landing.match(/\{\s*icon:/g);
    // 12 features + 3 how-it-works steps = 15 icon references in objects
    expect(featureMatches!.length).toBeGreaterThanOrEqual(12);
  });

  it("should include new killer features", () => {
    const landing = readFile("src/components/layout/LandingPage.tsx");
    expect(landing).toContain("Focus Mode");
    expect(landing).toContain("Weekly AI Report");
    expect(landing).toContain("Smart Templates");
    expect(landing).toContain("Calendar Heatmap");
    expect(landing).toContain("AI Meeting Prep");
  });

  it("should have animated app preview", () => {
    const landing = readFile("src/components/layout/LandingPage.tsx");
    expect(landing).toContain("AppPreview");
    expect(landing).toContain("Morning Workout");
    expect(landing).toContain("Deep Work");
    expect(landing).toContain("Krowna AI");
  });

  it("should have pricing section with 3 plans", () => {
    const landing = readFile("src/components/layout/LandingPage.tsx");
    expect(landing).toContain("Free");
    expect(landing).toContain("Pro");
    expect(landing).toContain("Ultra");
    expect(landing).toContain("MOST POPULAR");
  });

  it("should mention on-demand credits", () => {
    const landing = readFile("src/components/layout/LandingPage.tsx");
    expect(landing).toContain("extra AI credits");
  });

  it("should have how-it-works section", () => {
    const landing = readFile("src/components/layout/LandingPage.tsx");
    expect(landing).toContain("How it works");
    expect(landing).toContain("Set up your profile");
    expect(landing).toContain("Talk to Krowna");
    expect(landing).toContain("Let AI handle it");
  });

  it("should have all-in-one tags with new features", () => {
    const landing = readFile("src/components/layout/LandingPage.tsx");
    expect(landing).toContain("Focus Mode");
    expect(landing).toContain("Templates");
    expect(landing).toContain("Heatmap");
    expect(landing).toContain("Meeting Prep");
    expect(landing).toContain("Weekly Report");
  });
});

describe("Auth Pages", () => {
  it("login should have feature highlights", () => {
    const login = readFile("app/(auth)/login/page.tsx");
    expect(login).toContain("AI schedules your entire week");
    expect(login).toContain("voice assistant");
    expect(login).toContain("scheduling with friends");
    expect(login).toContain("goals and habits");
  });

  it("login should have social proof", () => {
    const login = readFile("app/(auth)/login/page.tsx");
    expect(login).toContain("Trusted by");
  });

  it("register should have free plan includes list", () => {
    const register = readFile("app/(auth)/register/page.tsx");
    expect(register).toContain("Free plan includes");
    expect(register).toContain("30 AI requests");
    expect(register).toContain("Voice input");
    expect(register).toContain("Friends");
  });

  it("register should have benefit cards", () => {
    const register = readFile("app/(auth)/register/page.tsx");
    expect(register).toContain("AI-Powered Scheduling");
    expect(register).toContain("All-in-One");
    expect(register).toContain("Personalized to You");
  });
});
