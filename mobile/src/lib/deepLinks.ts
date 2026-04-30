import * as Linking from "expo-linking";
import { router } from "expo-router";

/**
 * Parses deep link URLs like:
 * krowna://event/123 → opens event details
 * krowna://friend/xyz → opens friend profile
 * krowna://calendar → opens calendar
 * krowna://today → opens today view
 */
export function handleDeepLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path || parsed.hostname || "";

    if (path.startsWith("event/") || parsed.hostname === "event") {
      // krowna://event/<id> — preserve the id so the calendar can scroll to /
      // open the specific event when it mounts.
      const eventId = path.startsWith("event/")
        ? path.slice("event/".length)
        : (parsed.path || "").replace(/^\//, "");
      router.push({
        pathname: "/(tabs)/calendar",
        params: eventId ? { eventId } : {},
      });
      return true;
    }
    if (path.startsWith("friend/") || parsed.hostname === "friend") {
      const friendId = path.startsWith("friend/")
        ? path.slice("friend/".length)
        : (parsed.path || "").replace(/^\//, "");
      router.push({
        pathname: "/(tabs)/friends",
        params: friendId ? { friendId } : {},
      });
      return true;
    }
    if (path === "today" || parsed.hostname === "today") {
      router.push("/(tabs)/today");
      return true;
    }
    if (path === "calendar" || parsed.hostname === "calendar") {
      router.push("/(tabs)/calendar");
      return true;
    }
    if (path === "ai" || parsed.hostname === "ai") {
      router.push("/(tabs)/ai");
      return true;
    }
    if (path === "habits" || parsed.hostname === "habits") {
      router.push("/(tabs)/habits");
      return true;
    }
    if (path === "tasks" || parsed.hostname === "tasks") {
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
