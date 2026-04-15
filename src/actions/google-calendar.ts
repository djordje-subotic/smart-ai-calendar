"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getAuthUrl, getCalendarClient, getGoogleOAuthClient } from "@/src/lib/google-calendar";
import { revalidatePath } from "next/cache";

export async function getGoogleAuthUrl(): Promise<string> {
  return getAuthUrl();
}

export async function getGoogleSyncStatus(): Promise<{ connected: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { connected: false };

  const { data } = await supabase.from("profiles")
    .select("google_calendar_synced")
    .eq("id", user.id)
    .single();

  return { connected: data?.google_calendar_synced || false };
}

export async function disconnectGoogle(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({
    google_access_token: null,
    google_refresh_token: null,
    google_token_expiry: null,
    google_calendar_synced: false,
  }).eq("id", user.id);

  // Remove google-sourced events
  await supabase.from("events").delete().eq("user_id", user.id).eq("source", "google");

  revalidatePath("/settings");
  revalidatePath("/calendar");
}

// --- Generate Google Meet link ---
async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles")
    .select("google_access_token, google_refresh_token, google_token_expiry")
    .eq("id", userId)
    .single();

  if (!profile?.google_access_token) return null;

  // Check if token is expired
  const expiry = profile.google_token_expiry ? new Date(profile.google_token_expiry) : null;
  if (expiry && expiry > new Date()) {
    return profile.google_access_token;
  }

  // Refresh the token
  if (!profile.google_refresh_token) return null;
  try {
    const oauth = getGoogleOAuthClient();
    oauth.setCredentials({ refresh_token: profile.google_refresh_token });
    const { credentials } = await oauth.refreshAccessToken();

    await supabase.from("profiles").update({
      google_access_token: credentials.access_token,
      google_token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
    }).eq("id", userId);

    return credentials.access_token || null;
  } catch {
    return null;
  }
}

export async function generateMeetLink(
  title: string,
  startTime: string,
  endTime: string
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Not authenticated" };

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) {
    return { url: null, error: "Connect Google Calendar in Settings to generate Meet links" };
  }

  try {
    const calendar = getCalendarClient(accessToken);

    const event = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: title || "Krowna Meeting",
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        conferenceData: {
          createRequest: {
            requestId: `krowna-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetUrl = event.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri;

    // Delete the temporary Google Calendar event — we only needed the Meet link
    if (event.data.id) {
      await calendar.events.delete({ calendarId: "primary", eventId: event.data.id }).catch(() => {});
    }

    return { url: meetUrl || null };
  } catch (err) {
    console.error("Failed to generate Meet link:", err);
    return { url: null, error: "Failed to generate Meet link" };
  }
}
