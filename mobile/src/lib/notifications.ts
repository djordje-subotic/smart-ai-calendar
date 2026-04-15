import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Krowna",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F59E0B",
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ push_token: token }).eq("id", user.id);
    }
    return token;
  } catch {
    return null;
  }
}

export async function scheduleEventReminder(title: string, startTime: string, minutesBefore: number = 15) {
  const eventDate = new Date(startTime);
  const reminderDate = new Date(eventDate.getTime() - minutesBefore * 60000);

  if (reminderDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Upcoming: " + title,
      body: `Starting in ${minutesBefore} minutes`,
      sound: true,
      data: { type: "event_reminder" },
    },
    trigger: { type: "date", date: reminderDate } as any,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

type ReminderEvent = {
  id: string;
  title: string;
  start_time: string;
  reminder_minutes?: number[] | null;
  location?: string | null;
};

/**
 * Replace the full schedule of event reminders. Clears any previously
 * scheduled "event_reminder" notifications and re-schedules from scratch so
 * deletes/edits don't leak stale reminders.
 *
 * iOS caps at ~64 pending local notifications total — we trim aggressively
 * (nearest 30 events within 24h) to stay safely under that.
 */
export async function syncEventReminders(events: ReminderEvent[]) {
  try {
    // Cancel only our previously scheduled event reminders
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of pending) {
      const data = n.content.data as any;
      if (data?.type === "event_reminder") {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    const now = Date.now();
    const horizon = now + 24 * 60 * 60 * 1000;

    const candidates = events
      .filter((e) => {
        const t = new Date(e.start_time).getTime();
        return Number.isFinite(t) && t > now && t <= horizon;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 30);

    for (const event of candidates) {
      const start = new Date(event.start_time);
      const offsets = event.reminder_minutes?.length ? event.reminder_minutes : [15];
      for (const offset of offsets) {
        const fireAt = new Date(start.getTime() - offset * 60_000);
        if (fireAt.getTime() <= now) continue;

        const minutesText = offset === 0
          ? "starting now"
          : offset >= 60
          ? `in ${Math.round(offset / 60)} hour${offset >= 120 ? "s" : ""}`
          : `in ${offset} min`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: event.title,
            body: event.location ? `${minutesText} · ${event.location}` : minutesText,
            sound: true,
            data: { type: "event_reminder", event_id: event.id },
          },
          trigger: { type: "date", date: fireAt } as any,
        });
      }
    }
  } catch {
    // Silently ignore — notification scheduling is best-effort
  }
}

/**
 * Handle notification tap - route to appropriate screen based on notification type.
 * Call this once in root layout to set up listener.
 */
export function setupNotificationHandlers() {
  // When user taps a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;

    if (data?.type === "event_reminder") {
      router.push("/(tabs)/today");
    } else if (data?.type === "friend_request" || data?.type === "invite_accepted") {
      router.push("/(tabs)/friends");
    } else if (data?.type === "event_invite" || data?.type === "counter_proposal") {
      router.push("/(tabs)/today");
    } else {
      router.push("/(tabs)/today");
    }
  });

  // When notification received while app in foreground (already displayed by handler)
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    // Can add custom behavior here (e.g., update badge count)
    console.log("Notification received:", notification.request.content.title);
  });

  return () => {
    responseSubscription.remove();
    receivedSubscription.remove();
  };
}
