import * as Linking from "expo-linking";
import { router } from "expo-router";

/**
 * Parses deep link URLs like:
 * krowna://event/123 → opens calendar focused on that event
 * krowna://friend/xyz → opens friend profile
 * krowna://calendar → opens calendar
 * krowna://today → opens today view
 */
export function handleDeepLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    // expo-linking parses `krowna://event/123` as hostname=event, path=123
    // and `krowna:event/123` (web-style) as path=event/123. Handle both.
    const route = (parsed.hostname || parsed.path || "").replace(/^\//, "");
    const [head, ...rest] = route.split("/");
    const id = rest.join("/");

    if (head === "event") {
      router.push({ pathname: "/(tabs)/calendar", params: id ? { eventId: id } : undefined });
      return true;
    }
    if (head === "friend") {
      router.push({ pathname: "/(tabs)/friends", params: id ? { friendId: id } : undefined });
      return true;
    }
    if (head === "today") {
      router.push("/(tabs)/today");
      return true;
    }
    if (head === "calendar") {
      router.push("/(tabs)/calendar");
      return true;
    }
    if (head === "ai") {
      router.push("/(tabs)/ai");
      return true;
    }
    if (head === "habits") {
      router.push("/(tabs)/habits");
      return true;
    }
    if (head === "tasks") {
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
