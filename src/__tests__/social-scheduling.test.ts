import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

describe("Social Scheduling - Multi-User Event Flow", () => {
  describe("Friend Request System", () => {
    it("sendFriendRequest should validate self-add", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("friendId === user.id");
      expect(code).toContain("can't add yourself");
    });

    it("sendFriendRequest should check existing friendships", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("Already friends or request pending");
    });

    it("sendFriendRequest should create notification for friend", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("friend_request");
      expect(code).toContain("wants to connect");
    });

    it("respondToFriendRequest should handle accept and decline", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("accept ? \"accepted\" : \"declined\"");
    });

    it("getFriends should return enriched profile data", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("display_name");
      expect(code).toContain("avatar_url");
      expect(code).toContain("city");
      expect(code).toContain("date_of_birth");
      expect(code).toContain("occupation");
      expect(code).toContain("motto");
    });

    it("getFriends should include timezone info", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("otherTimezone");
      expect(code).toContain("myTimezone");
    });
  });

  describe("Event Invite System", () => {
    it("createEventInvite should check for conflicts", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("conflicts");
      expect(code).toContain("negotiating");
    });

    it("createEventInvite should notify invitee", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("event_invite");
      expect(code).toContain("invited you to");
    });

    it("respondToInvite accept should create events for BOTH users", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("invite.organizer_id");
      expect(code).toContain("invite.invitee_id");
      // Should check errors on both inserts
      expect(code).toContain("orgErr");
      expect(code).toContain("invErr");
    });

    it("respondToInvite accept should handle counter-proposed times", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("invite.counter_start || invite.proposed_start");
      expect(code).toContain("invite.counter_end || invite.proposed_end");
    });

    it("respondToInvite counter should store counter data", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("counter_start");
      expect(code).toContain("counter_end");
      expect(code).toContain("counter_message");
    });

    it("respondToInvite should notify other party for all actions", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("invite_accepted");
      expect(code).toContain("invite_declined");
      expect(code).toContain("counter_proposal");
    });

    it("respondToInvite decline should NOT create events", () => {
      const code = readFile("src/actions/social.ts");
      // After "decline" section, there should be no event insert
      const declineSection = code.split("action === \"decline\"")[1]?.split("action === \"counter\"")[0] || "";
      expect(declineSection).not.toContain(".from(\"events\").insert");
    });
  });

  describe("Timezone Awareness", () => {
    it("getMyInvites should return both timezones", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("otherTimezone");
      expect(code).toContain("myTimezone");
      expect(code).toContain("timezone");
    });

    it("InvitePanel should display timezone difference", () => {
      const panel = readFile("src/components/social/InvitePanel.tsx");
      expect(panel).toContain("myTimezone !== inv.otherTimezone");
      expect(panel).toContain("Globe");
    });
  });

  describe("Mutual Free Time Finder", () => {
    it("findMutualFreeTime should check both users calendars", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("myEvents");
      expect(code).toContain("theirEvents");
      expect(code).toContain("Promise.all");
    });

    it("findMutualFreeTime should skip weekends", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("getDay() === 0 || day.getDay() === 6");
    });

    it("findMutualFreeTime should only check working hours", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("h = 9");
      expect(code).toContain("18");
    });
  });

  describe("Notifications", () => {
    it("should have notification read/unread system", () => {
      const code = readFile("src/actions/social.ts");
      expect(code).toContain("markNotificationRead");
      expect(code).toContain("getUnreadCount");
      expect(code).toContain("read");
    });
  });
});

describe("Social UI Components", () => {
  describe("InvitePanel", () => {
    it("should show accept, suggest time, and decline buttons", () => {
      const panel = readFile("src/components/social/InvitePanel.tsx");
      expect(panel).toContain("Accept");
      expect(panel).toContain("Suggest time");
      expect(panel).toContain("handleAccept");
      expect(panel).toContain("handleDecline");
      expect(panel).toContain("handleCounter");
    });

    it("counter offer should include time and message inputs", () => {
      const panel = readFile("src/components/social/InvitePanel.tsx");
      expect(panel).toContain("type=\"time\"");
      expect(panel).toContain("Message (optional)");
    });

    it("should poll for new invites", () => {
      const panel = readFile("src/components/social/InvitePanel.tsx");
      expect(panel).toContain("setInterval");
      expect(panel).toContain("30000");
    });
  });

  describe("Friends Page", () => {
    it("should support adding friends by email", () => {
      const page = readFile("app/(dashboard)/friends/page.tsx");
      expect(page).toContain("email");
      expect(page).toContain("sendFriendRequest");
    });

    it("should display birthday alerts", () => {
      const page = readFile("app/(dashboard)/friends/page.tsx");
      expect(page).toContain("getBirthdayLabel");
      expect(page).toContain("Birthday today");
      expect(page).toContain("Birthday tomorrow");
      expect(page).toContain("Birthday in");
    });

    it("getBirthdayLabel should handle invalid dates safely", () => {
      const page = readFile("app/(dashboard)/friends/page.tsx");
      expect(page).toContain("isNaN(birth.getTime())");
    });

    it("search should handle null values safely", () => {
      const page = readFile("app/(dashboard)/friends/page.tsx");
      expect(page).toContain('|| ""');
    });

    it("should show friend profile details", () => {
      const page = readFile("app/(dashboard)/friends/page.tsx");
      expect(page).toContain("occupation");
      expect(page).toContain("city");
      expect(page).toContain("date_of_birth");
      expect(page).toContain("motto");
    });
  });

  describe("Mobile Friends", () => {
    it("mobile friends should support add by email", () => {
      const page = readFile("mobile/app/(tabs)/friends.tsx");
      expect(page).toContain("email");
      expect(page).toContain("find_user_by_email");
    });

    it("find_user_by_email is defined as an RPC in a migration", () => {
      // Code on web and mobile depends on this function existing — without
      // the migration, every "Add Friend" attempt fails with "function does
      // not exist" and the friend system is dead.
      const fs = require("node:fs");
      const path = require("node:path");
      const dir = path.resolve(process.cwd(), "supabase/migrations");
      const sql = fs.readdirSync(dir)
        .filter((f: string) => f.endsWith(".sql"))
        .map((f: string) => fs.readFileSync(path.join(dir, f), "utf8"))
        .join("\n");
      expect(sql).toMatch(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION[^(]*find_user_by_email/i);
    });

    it("mobile friends should show profile details", () => {
      const page = readFile("mobile/app/(tabs)/friends.tsx");
      expect(page).toContain("occupation");
      expect(page).toContain("city");
      expect(page).toContain("date_of_birth");
    });
  });
});
