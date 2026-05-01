import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

describe("EventModal — error handling", () => {
  const code = readFile("src/components/calendar/EventModal.tsx");

  it("does not use native alert() for validation errors", () => {
    expect(code).not.toMatch(/\balert\(/);
  });

  it("validation errors surface through toast", () => {
    expect(code).toContain('toast.error("Please set valid start and end times")');
  });

  it("save errors are caught and surfaced to the user", () => {
    expect(code).toContain("try {");
    expect(code).toContain("Could not save event");
  });

  it("delete errors are caught and surfaced to the user", () => {
    expect(code).toContain("Could not delete event");
  });
});

describe("Share booking — notification schema", () => {
  it("uses the message column (not body) when inserting into notifications", () => {
    const route = readFile("app/api/share/[slug]/book/route.ts");
    // Find the booking_received notification block
    const bookingBlock = route.split("booking_received")[1] || "";
    expect(bookingBlock).toContain("message:");
    expect(bookingBlock).not.toMatch(/\bbody:\s*`/);
  });
});
