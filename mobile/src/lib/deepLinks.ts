import * as Linking from "expo-linking";
import { router } from "expo-router";

/**
 * Parses deep link URLs like:
 * kron://event/123 → opens event details
 * kron://friend/xyz → opens friend profile
 * kron://calendar → opens calendar
 * kron://today → opens today view
 */
export function handleDeepLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path || parsed.hostname || "";

    if (path.startsWith("event/") || parsed.hostname === "event") {
      router.push("/(tabs)/calendar");
      return true;
    }
    if (path.startsWith("friend/") || parsed.hostname === "friend") {
      router.push("/(tabs)/friends");
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
