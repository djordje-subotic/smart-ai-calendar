import { describe, it, expect } from "vitest";
import { CREDIT_PACKAGES } from "@/src/constants/credits";

describe("Credit Packages", () => {
  it("should have 3 packages", () => {
    expect(CREDIT_PACKAGES).toHaveLength(3);
  });

  it("each package should have required fields", () => {
    for (const pack of CREDIT_PACKAGES) {
      expect(pack.id).toBeTruthy();
      expect(pack.credits).toBeGreaterThan(0);
      expect(pack.priceCents).toBeGreaterThan(0);
      expect(pack.price).toBeTruthy();
      expect(pack.perCredit).toBeTruthy();
    }
  });

  it("prices should increase with credits", () => {
    const sorted = [...CREDIT_PACKAGES].sort((a, b) => a.credits - b.credits);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].priceCents).toBeGreaterThan(sorted[i - 1].priceCents);
    }
  });

  it("per-credit cost should decrease with larger packages", () => {
    const sorted = [...CREDIT_PACKAGES].sort((a, b) => a.credits - b.credits);
    for (let i = 1; i < sorted.length; i++) {
      const prevPerCredit = sorted[i - 1].priceCents / sorted[i - 1].credits;
      const currPerCredit = sorted[i].priceCents / sorted[i].credits;
      expect(currPerCredit).toBeLessThan(prevPerCredit);
    }
  });

  it("should have exactly one popular package", () => {
    const popular = CREDIT_PACKAGES.filter((p) => p.popular);
    expect(popular).toHaveLength(1);
  });

  it("package IDs should be unique", () => {
    const ids = CREDIT_PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
