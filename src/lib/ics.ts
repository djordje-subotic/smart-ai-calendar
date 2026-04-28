/**
 * Minimal iCalendar (RFC 5545) parser.
 *
 * We only care about VEVENT rows: UID, SUMMARY, DTSTART, DTEND, LOCATION,
 * DESCRIPTION. Recurrence rules are intentionally not expanded — good enough
 * for subscribed calendars where the upstream already includes expanded
 * instances (iCloud, Google public feeds).
 *
 * Handles:
 *  - line unfolding (continuation lines starting with space/tab)
 *  - DTSTART/DTEND with TZID or Z suffix
 *  - all-day DATE values (no time)
 *  - basic escaped characters
 */

export type ParsedIcsEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
};

export function parseIcs(text: string): ParsedIcsEvent[] {
  const unfolded = unfold(text);
  const lines = unfolded.split(/\r?\n/);

  const events: ParsedIcsEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) {
        const ev = toEvent(current);
        if (ev) events.push(ev);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    // "KEY;PARAM=VAL:VALUE" → key / value
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const left = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    const semi = left.indexOf(";");
    const key = (semi === -1 ? left : left.slice(0, semi)).toUpperCase();
    const params = semi === -1 ? "" : left.slice(semi + 1);
    current[key] = value;
    if (params) current[`${key}_PARAMS`] = params;
  }

  return events;
}

function unfold(text: string): string {
  // RFC 5545 "line folding": continuation lines start with a space or tab
  return text.replace(/\r?\n[ \t]/g, "");
}

function unescapeText(v: string) {
  return v
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseDate(value: string, params: string | undefined): { iso: string; allDay: boolean } | null {
  // All-day: "VALUE=DATE" in params, value like "20260411"
  const isDateOnly = /VALUE=DATE/i.test(params || "") || /^\d{8}$/.test(value);
  if (isDateOnly) {
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
    if (!m) return null;
    return { iso: `${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`, allDay: true };
  }

  // UTC form: "20260411T143000Z"
  const utc = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (utc) {
    const [, y, mo, d, h, mi, s] = utc;
    return {
      iso: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString(),
      allDay: false,
    };
  }

  // Local / floating form (with or without TZID parameter).
  // Without bundling a tz database we can't shift TZID-tagged times to
  // their true UTC instant — projecting them to UTC keeps the wall-clock
  // numbers visible to the user, which is the closest we can get.
  const local = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (local) {
    const [, y, mo, d, h, mi, s] = local;
    const tzid = /TZID=([^;:]+)/i.exec(params || "")?.[1];
    const offsetMs = tzid ? tzidOffsetMs(tzid) : 0;
    return {
      iso: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - offsetMs).toISOString(),
      allDay: false,
    };
  }

  return null;
}

/**
 * Best-effort offset lookup for an IANA TZID, in ms ahead of UTC, using the
 * platform's Intl tz database. Returns 0 if the TZID is unknown so events
 * still import (with wall-clock semantics) rather than being dropped.
 */
function tzidOffsetMs(tzid: string): number {
  try {
    const probe = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tzid,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(probe);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const local = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") % 24,
      get("minute"),
      get("second"),
    );
    return local - probe.getTime();
  } catch {
    return 0;
  }
}

function toEvent(raw: Record<string, string>): ParsedIcsEvent | null {
  const uid = raw["UID"];
  const summary = raw["SUMMARY"];
  const dtstart = raw["DTSTART"];
  const dtend = raw["DTEND"];
  if (!uid || !dtstart) return null;

  const start = parseDate(dtstart, raw["DTSTART_PARAMS"]);
  const end = dtend ? parseDate(dtend, raw["DTEND_PARAMS"]) : null;
  if (!start) return null;

  // If no DTEND is present (common in Apple Calendar for point events),
  // assume a 1-hour event.
  const endIso = end?.iso || new Date(new Date(start.iso).getTime() + 60 * 60 * 1000).toISOString();

  return {
    uid,
    title: summary ? unescapeText(summary) : "(no title)",
    description: raw["DESCRIPTION"] ? unescapeText(raw["DESCRIPTION"]) : undefined,
    location: raw["LOCATION"] ? unescapeText(raw["LOCATION"]) : undefined,
    start: start.iso,
    end: endIso,
    allDay: start.allDay,
  };
}

/**
 * Convert a webcal:// URL to https:// — webcal is just an iCal URI scheme.
 */
export function normalizeIcsUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("webcal://")) return "https://" + trimmed.slice("webcal://".length);
  if (trimmed.startsWith("webcals://")) return "https://" + trimmed.slice("webcals://".length);
  return trimmed;
}
