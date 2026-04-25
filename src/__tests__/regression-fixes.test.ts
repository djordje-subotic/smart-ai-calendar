import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

/**
 * Regression tests for bugs found while auditing for unfinished features.
 * These pin down fixes so they can't silently revert.
 *
 * 1. find_user_by_email RPC: referenced from web + mobile but was missing
 *    from migrations; "add friend by email" was broken end-to-end.
 * 2. Booking notification used `body:` while the column is `message:`.
 * 3. /api/share/[slug]/book had a SELECT-then-INSERT race; a Postgres
 *    EXCLUDE constraint now rejects overlapping confirmed bookings.
 * 4. habits page left `console.log("Toggle result")` in shipping code.
 * 5. settings page advertised iCloud / Outlook as "Coming soon" while
 *    External calendars below already covered both via webcal/ICS URLs.
 */

describe("regression: find_user_by_email RPC must be defined", () => {
  it("at least one migration creates find_user_by_email", () => {
    const dir = "supabase/migrations";
    const files = readdirSync(join(process.cwd(), dir)).filter((f) => f.endsWith(".sql"));
    const all = files.map((f) => read(`${dir}/${f}`)).join("\n");
    expect(all).toMatch(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?find_user_by_email/i);
  });

  it("RPC takes target_email and returns UUID", () => {
    const sql = read("supabase/migrations/018_user_lookup_and_booking_overlap_guard.sql");
    expect(sql).toContain("find_user_by_email(target_email TEXT)");
    expect(sql).toMatch(/RETURNS\s+UUID/i);
  });

  it("RPC is SECURITY DEFINER (so it can read auth.users)", () => {
    const sql = read("supabase/migrations/018_user_lookup_and_booking_overlap_guard.sql");
    expect(sql).toContain("SECURITY DEFINER");
  });

  it("legacy alias get_user_id_by_email still exists for older clients", () => {
    const sql = read("supabase/migrations/018_user_lookup_and_booking_overlap_guard.sql");
    expect(sql).toContain("get_user_id_by_email(email_input TEXT)");
  });
});

describe("regression: booking notification column", () => {
  it("/api/share/[slug]/book inserts `message`, not `body`", () => {
    const code = read("app/api/share/[slug]/book/route.ts");
    // The notifications.insert call should use the real column name.
    expect(code).toMatch(/type:\s*"booking_received"[\s\S]*message:\s*`/);
    // And not the old broken one.
    const insertBlock = code.split('type: "booking_received"')[1]?.split("})")[0] ?? "";
    expect(insertBlock).not.toMatch(/\bbody:\s*`/);
  });
});

describe("regression: booking double-book guard", () => {
  it("migration 018 adds an EXCLUDE constraint on share_link_bookings", () => {
    const sql = read("supabase/migrations/018_user_lookup_and_booking_overlap_guard.sql");
    expect(sql).toContain("EXCLUDE USING gist");
    expect(sql).toContain("share_link_bookings_no_overlap");
    expect(sql).toMatch(/WHERE\s*\(\s*status\s*=\s*'confirmed'\s*\)/i);
  });

  it("/api/share/[slug]/book maps the constraint violation to a 409", () => {
    const code = read("app/api/share/[slug]/book/route.ts");
    // 23P01 is Postgres' exclusion_violation SQLSTATE.
    expect(code).toContain("23P01");
    expect(code).toMatch(/status:\s*409/);
  });

  it("/api/share/[slug]/book rolls back the placeholder event on conflict", () => {
    const code = read("app/api/share/[slug]/book/route.ts");
    // After the constraint violation we must not leave the host's calendar
    // dirty with the speculative event we just inserted.
    expect(code).toMatch(/from\("events"\)[\s\S]*\.delete\(\)[\s\S]*\.eq\("id",\s*event\.id\)/);
  });
});

describe("regression: shipping noise", () => {
  it("habits page no longer logs Toggle result", () => {
    const code = read("app/(dashboard)/habits/page.tsx");
    expect(code).not.toContain('console.log("Toggle result');
  });

  it("settings page no longer advertises iCloud / Outlook as Coming soon", () => {
    const code = read("app/(dashboard)/settings/page.tsx");
    // The duplicate stub block is gone — the External calendars panel
    // (CalendarSubscriptionsPanel) handles both providers via webcal/ICS.
    expect(code).not.toMatch(/Apple Calendar"[\s\S]{0,200}Coming soon/);
    expect(code).not.toMatch(/"Outlook"[\s\S]{0,200}Coming soon/);
  });
});

describe("regression: social.ts dead code removed", () => {
  it("sendFriendRequest no longer makes the dead allProfiles fetch", () => {
    const code = read("src/actions/social.ts");
    // The original code did .from("profiles").select("id, full_name") and
    // discarded the result — load every row in the table on every add.
    const sendBlock =
      code.split("export async function sendFriendRequest")[1]?.split("export ")[0] ?? "";
    expect(sendBlock).not.toMatch(/select\("id,\s*full_name"\)\s*;\s*$/m);
    // Only one RPC call left — the working one.
    const rpcCalls = sendBlock.match(/\.rpc\(/g) ?? [];
    expect(rpcCalls.length).toBe(1);
  });
});
