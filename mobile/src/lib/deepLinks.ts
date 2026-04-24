import * as Linking from "expo-linking";
import { router } from "expo-router";

/**
 * Parses deep link URLs like:
 * krowna://event/123 → opens event details
 * krowna://friend/xyz → opens friend profile
 * krowna://calendar → opens calendar
 * krowna://today → opens today view
 */
function extractId(path: string, prefix: string, hostname: string | null): string | null {
  // krowna://event/123 → hostname=event, path=123 (or /123)
  // krowna://event → hostname=event, path=""
  // krowna:///event/123 → hostname=null, path=event/123
  if (hostname === prefix.replace("/", "")) {
    return path.replace(/^\/+/, "") || null;
  }
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length) || null;
  }
  return null;
}

export function handleDeepLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path || "";
    const hostname = parsed.hostname || null;
    const combined = hostname ? `${hostname}/${path.replace(/^\/+/, "")}`.replace(/\/$/, "") : path;

    const eventId = extractId(path, "event/", hostname);
    if (eventId || hostname === "event" || path.startsWith("event")) {
      router.push(eventId ? `/(tabs)/calendar?eventId=${encodeURIComponent(eventId)}` : "/(tabs)/calendar");
      return true;
    }

    const friendId = extractId(path, "friend/", hostname);
    if (friendId || hostname === "friend" || path.startsWith("friend")) {
      router.push(friendId ? `/(tabs)/friends?friendId=${encodeURIComponent(friendId)}` : "/(tabs)/friends");
      return true;
    }

    if (combined === "today" || hostname === "today") {
      router.push("/(tabs)/today");
      return true;
    }
    if (combined === "calendar" || hostname === "calendar") {
      router.push("/(tabs)/calendar");
      return true;
    }
    if (combined === "ai" || hostname === "ai") {
      router.push("/(tabs)/ai");
      return true;
    }
    if (combined === "habits" || hostname === "habits") {
      router.push("/(tabs)/habits");
      return true;
    }
    if (combined === "tasks" || hostname === "tasks") {
      router.push("/(tabs)/tasks");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function initDeepLinks() {
  // Handle initial URL (app opened from link)
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url);
  });

  // Handle URLs while app is running
  const subscription = Linking.addEventListener("url", ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription.remove();
}
