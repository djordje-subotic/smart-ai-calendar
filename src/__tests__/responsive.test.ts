import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf-8");
}

describe("Responsive Design", () => {
  it("dashboard layout should hide sidebar on mobile", () => {
    const layout = readFile("app/(dashboard)/layout.tsx");
    expect(layout).toContain("hidden lg:flex");
    expect(layout).toContain("MobileDrawer");
  });

  it("header should have mobile menu button", () => {
    const header = readFile("src/components/layout/Header.tsx");
    expect(header).toContain("lg:hidden");
    expect(header).toContain("Menu");
    expect(header).toContain("setMobileMenuOpen");
  });

  it("header view switcher should be hidden on small screens", () => {
    const header = readFile("src/components/layout/Header.tsx");
    expect(header).toContain("hidden sm:flex");
  });

  it("pages should have responsive padding", () => {
    const pages = [
      "app/(dashboard)/settings/page.tsx",
      "app/(dashboard)/profile/page.tsx",
      "app/(dashboard)/friends/page.tsx",
      "app/(dashboard)/habits/page.tsx",
      "app/(dashboard)/tools/page.tsx",
    ];
    for (const page of pages) {
      const content = readFile(page);
      expect(content).toContain("p-4 sm:p-6");
    }
  });

  it("root layout should have viewport export", () => {
    const layout = readFile("app/layout.tsx");
    expect(layout).toContain("export const viewport");
    expect(layout).toContain("device-width");
  });

  it("WeekView should not hardcode sidebar width", () => {
    const weekView = readFile("src/components/calendar/WeekView.tsx");
    expect(weekView).not.toContain("260");
    expect(weekView).toContain("containerRef");
  });

  it("MobileDrawer should exist and have navigation", () => {
    const drawer = readFile("src/components/layout/MobileDrawer.tsx");
    expect(drawer).toContain("/calendar");
    expect(drawer).toContain("/today");
    expect(drawer).toContain("/habits");
    expect(drawer).toContain("/tools");
    expect(drawer).toContain("/friends");
    expect(drawer).toContain("/settings");
    expect(drawer).toContain("isMobileMenuOpen");
  });
});

describe("Sidebar Structure", () => {
  it("should not contain energy widgets (moved to tools)", () => {
    const sidebar = readFile("src/components/layout/Sidebar.tsx");
    expect(sidebar).not.toContain("EnergyIndicator");
    expect(sidebar).not.toContain("EnergyTimeline");
    expect(sidebar).not.toContain("CalendarHeatmap");
  });

  it("should contain essential widgets", () => {
    const sidebar = readFile("src/components/layout/Sidebar.tsx");
    expect(sidebar).toContain("ProfilePanel");
    expect(sidebar).toContain("MiniCalendar");
    expect(sidebar).toContain("ScheduleScore");
    expect(sidebar).toContain("UpcomingEvents");
    expect(sidebar).toContain("TaskPanel");
  });

  it("should have AI Tools in navigation", () => {
    const sidebar = readFile("src/components/layout/Sidebar.tsx");
    expect(sidebar).toContain("AI Tools");
    expect(sidebar).toContain("/tools");
    expect(sidebar).toContain("Wand2");
  });
});
