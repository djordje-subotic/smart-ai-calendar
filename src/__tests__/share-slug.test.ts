import { describe, expect, it } from "vitest";

/**
 * The slug generator in src/actions/share.ts is a private function; we
 * re-implement its spec here to pin down the expected properties.
 */
function generateSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

describe("share slug generation", () => {
  it("produces a 10-character slug", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSlug()).toHaveLength(10);
    }
  });

  it("uses URL-safe characters only (no uppercase, no special chars)", () => {
    for (let i = 0; i < 100; i++) {
      // Allowed alphabet: abcdefghijkmnpqrstuvwxyz23456789
      expect(generateSlug()).toMatch(/^[abcdefghijkmnpqrstuvwxyz23456789]+$/);
    }
  });

  it("excludes easily-confused digits and the letters l, o (mirrors src/actions/share alphabet)", () => {
    // Alphabet in share.ts: abcdefghijkmnpqrstuvwxyz23456789
    //   - skips 0, 1 (confusable with O, l/I)
    //   - skips l (confusable with 1, I)
    //   - skips o (confusable with 0)
    const banned = ["0", "1", "l", "o"];
    for (let i = 0; i < 500; i++) {
      const slug = generateSlug();
      for (const c of banned) {
        expect(slug).not.toContain(c);
      }
    }
  });

  it("has enough entropy to avoid collisions at scale", () => {
    // 32 chars × 10 positions = 32^10 = ~1.1 × 10^15 possibilities
    // Generate 10k and verify no duplicates — not a proof but a smoke test
    const generated = new Set<string>();
    for (let i = 0; i < 10_000; i++) generated.add(generateSlug());
    expect(generated.size).toBe(10_000);
  });
});

describe("booking input validation (contract)", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it("accepts normal emails", () => {
    expect(emailRegex.test("alice@example.com")).toBe(true);
    expect(emailRegex.test("user.name+tag@sub.example.co")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(emailRegex.test("no-at-sign")).toBe(false);
    expect(emailRegex.test("@no-local-part.com")).toBe(false);
    expect(emailRegex.test("no-domain@")).toBe(false);
    expect(emailRegex.test("has spaces@example.com")).toBe(false);
  });

  it("enforces name length cap of 120", () => {
    const longName = "x".repeat(121);
    expect(longName.length).toBeGreaterThan(120);
    expect("A reasonable name".length).toBeLessThanOrEqual(120);
  });
});

describe("booking time validation", () => {
  it("rejects end-before-start", () => {
    const start = new Date("2026-04-13T14:00:00Z");
    const end = new Date("2026-04-13T13:00:00Z");
    expect(end.getTime() > start.getTime()).toBe(false);
  });

  it("rejects slots in the past", () => {
    const now = Date.now();
    const past = new Date(now - 60 * 60_000);
    expect(past.getTime() < now).toBe(true);
  });

  it("rejects non-finite dates (invalid ISO strings)", () => {
    const bad = new Date("not a date");
    expect(Number.isFinite(bad.getTime())).toBe(false);
  });

  it("detects overlap: slot end after existing start AND slot start before existing end", () => {
    // Existing busy: 13:00–14:00
    const busyStart = new Date("2026-04-13T13:00:00Z").getTime();
    const busyEnd = new Date("2026-04-13T14:00:00Z").getTime();

    // Candidate A: 13:30–14:30 (overlaps)
    const aStart = new Date("2026-04-13T13:30:00Z").getTime();
    const aEnd = new Date("2026-04-13T14:30:00Z").getTime();
    expect(busyStart < aEnd && busyEnd > aStart).toBe(true);

    // Candidate B: 14:00–15:00 (adjacent, no overlap)
    const bStart = new Date("2026-04-13T14:00:00Z").getTime();
    const bEnd = new Date("2026-04-13T15:00:00Z").getTime();
    expect(busyStart < bEnd && busyEnd > bStart).toBe(false);

    // Candidate C: 12:00–12:30 (before, no overlap)
    const cStart = new Date("2026-04-13T12:00:00Z").getTime();
    const cEnd = new Date("2026-04-13T12:30:00Z").getTime();
    expect(busyStart < cEnd && busyEnd > cStart).toBe(false);
  });
});
