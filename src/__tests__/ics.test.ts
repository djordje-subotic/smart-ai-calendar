import { describe, expect, it } from "vitest";
import { parseIcs, normalizeIcsUrl } from "@/src/lib/ics";

describe("normalizeIcsUrl", () => {
  it("converts webcal:// to https://", () => {
    expect(normalizeIcsUrl("webcal://p01.icloud.com/published/abc")).toBe(
      "https://p01.icloud.com/published/abc"
    );
  });

  it("converts webcals:// to https://", () => {
    expect(normalizeIcsUrl("webcals://secure.example.com/cal.ics")).toBe(
      "https://secure.example.com/cal.ics"
    );
  });

  it("leaves https URLs untouched", () => {
    expect(normalizeIcsUrl("https://calendar.google.com/feed.ics")).toBe(
      "https://calendar.google.com/feed.ics"
    );
  });

  it("trims whitespace", () => {
    expect(normalizeIcsUrl("  webcal://example.com/cal  ")).toBe("https://example.com/cal");
  });
});

describe("parseIcs — basic VEVENT", () => {
  const simpleVevent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:event-1@example.com
SUMMARY:Team standup
DTSTART:20260413T090000Z
DTEND:20260413T093000Z
LOCATION:Zoom
DESCRIPTION:Daily standup meeting
END:VEVENT
END:VCALENDAR`;

  it("parses a single event", () => {
    const events = parseIcs(simpleVevent);
    expect(events).toHaveLength(1);
  });

  it("extracts UID, title, location, description", () => {
    const [event] = parseIcs(simpleVevent);
    expect(event.uid).toBe("event-1@example.com");
    expect(event.title).toBe("Team standup");
    expect(event.location).toBe("Zoom");
    expect(event.description).toBe("Daily standup meeting");
  });

  it("parses UTC DTSTART/DTEND into ISO strings", () => {
    const [event] = parseIcs(simpleVevent);
    expect(event.start).toBe("2026-04-13T09:00:00.000Z");
    expect(event.end).toBe("2026-04-13T09:30:00.000Z");
  });

  it("marks non-DATE events as not all-day", () => {
    const [event] = parseIcs(simpleVevent);
    expect(event.allDay).toBe(false);
  });
});

describe("parseIcs — all-day events", () => {
  const allDay = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:holiday-1
SUMMARY:New Year
DTSTART;VALUE=DATE:20270101
DTEND;VALUE=DATE:20270102
END:VEVENT
END:VCALENDAR`;

  it("marks VALUE=DATE as all-day", () => {
    const [event] = parseIcs(allDay);
    expect(event.allDay).toBe(true);
  });

  it("uses midnight UTC for all-day dates", () => {
    const [event] = parseIcs(allDay);
    expect(event.start).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("parseIcs — multiple events", () => {
  const multi = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:a
SUMMARY:First
DTSTART:20260413T090000Z
DTEND:20260413T100000Z
END:VEVENT
BEGIN:VEVENT
UID:b
SUMMARY:Second
DTSTART:20260413T140000Z
DTEND:20260413T150000Z
END:VEVENT
END:VCALENDAR`;

  it("returns both events in order", () => {
    const events = parseIcs(multi);
    expect(events).toHaveLength(2);
    expect(events[0].uid).toBe("a");
    expect(events[1].uid).toBe("b");
  });
});

describe("parseIcs — edge cases", () => {
  it("handles line folding (RFC 5545 continuation)", () => {
    // Apple Calendar and others fold long lines with a leading space
    const folded = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:folded-1
SUMMARY:A very long title that got
 folded over two lines
DTSTART:20260413T090000Z
DTEND:20260413T100000Z
END:VEVENT
END:VCALENDAR`;
    const [event] = parseIcs(folded);
    expect(event.title).toBe("A very long title that gotfolded over two lines");
  });

  it("unescapes \\n, \\,, \\;", () => {
    const escaped = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:escape-1
SUMMARY:Meeting\\, urgent
DESCRIPTION:Line 1\\nLine 2\\nLine 3
DTSTART:20260413T090000Z
DTEND:20260413T100000Z
END:VEVENT
END:VCALENDAR`;
    const [event] = parseIcs(escaped);
    expect(event.title).toBe("Meeting, urgent");
    expect(event.description).toBe("Line 1\nLine 2\nLine 3");
  });

  it("ignores events missing UID or DTSTART", () => {
    const bad = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:No UID here
DTSTART:20260413T090000Z
DTEND:20260413T100000Z
END:VEVENT
BEGIN:VEVENT
UID:no-start
SUMMARY:Missing start
END:VEVENT
END:VCALENDAR`;
    expect(parseIcs(bad)).toHaveLength(0);
  });

  it("defaults end to start + 1 hour when DTEND is missing", () => {
    const noEnd = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:no-end
SUMMARY:Point event
DTSTART:20260413T090000Z
END:VEVENT
END:VCALENDAR`;
    const [event] = parseIcs(noEnd);
    expect(event.start).toBe("2026-04-13T09:00:00.000Z");
    expect(event.end).toBe("2026-04-13T10:00:00.000Z");
  });

  it("falls back to '(no title)' when SUMMARY is missing", () => {
    const noTitle = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:no-title
DTSTART:20260413T090000Z
DTEND:20260413T100000Z
END:VEVENT
END:VCALENDAR`;
    const [event] = parseIcs(noTitle);
    expect(event.title).toBe("(no title)");
  });

  it("returns empty array on empty input", () => {
    expect(parseIcs("")).toEqual([]);
  });

  it("returns empty array on malformed input", () => {
    expect(parseIcs("not an ics file at all")).toEqual([]);
  });

  it("handles CRLF line endings (standard)", () => {
    const crlf = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:crlf-1\r\nSUMMARY:Test\r\nDTSTART:20260413T090000Z\r\nDTEND:20260413T100000Z\r\nEND:VEVENT\r\nEND:VCALENDAR";
    const events = parseIcs(crlf);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Test");
  });

  it("handles local (floating) time by treating it as UTC", () => {
    const floating = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:floating-1
SUMMARY:Local time
DTSTART:20260413T090000
DTEND:20260413T100000
END:VEVENT
END:VCALENDAR`;
    const [event] = parseIcs(floating);
    expect(event.start).toBe("2026-04-13T09:00:00.000Z");
  });

  it("imports events with a TZID parameter (Apple/Outlook style)", () => {
    // 09:00 in America/New_York = 14:00 UTC in January.
    const tzid = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:tzid-1
SUMMARY:NYC meeting
DTSTART;TZID=America/New_York:20260115T090000
DTEND;TZID=America/New_York:20260115T100000
END:VEVENT
END:VCALENDAR`;
    const [event] = parseIcs(tzid);
    expect(event).toBeDefined();
    expect(event.uid).toBe("tzid-1");
    expect(event.start).toBe("2026-01-15T14:00:00.000Z");
    expect(event.end).toBe("2026-01-15T15:00:00.000Z");
  });

  it("does not drop events when TZID is unknown", () => {
    const unknown = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:tzid-bad
SUMMARY:Mystery zone
DTSTART;TZID=Not/A_Real_Zone:20260413T090000
DTEND;TZID=Not/A_Real_Zone:20260413T100000
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(unknown);
    expect(events).toHaveLength(1);
    // Falls back to wall-clock-as-UTC instead of dropping the event.
    expect(events[0].start).toBe("2026-04-13T09:00:00.000Z");
  });
});
