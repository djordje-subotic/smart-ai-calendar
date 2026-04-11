import { NextResponse } from "next/server";
import { getCalendarClient, getGoogleOAuthClient } from "@/src/lib/google-calendar";
import { createClient } from "@/src/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles")
      .select("google_access_token, google_refresh_token, google_token_expiry")
      .eq("id", user.id)
      .single();

    if (!profile?.google_access_token) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });
    }

    // Refresh token if expired
    let accessToken = profile.google_access_token;
    if (profile.google_token_expiry && new Date(profile.google_token_expiry) < new Date()) {
      const client = getGoogleOAuthClient();
      client.setCredentials({ refresh_token: profile.google_refresh_token });
      const { credentials } = await client.refreshAccessToken();
      accessToken = credentials.access_token!;

      await supabase.from("profiles").update({
        google_access_token: credentials.access_token,
        google_token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
      }).eq("id", user.id);
    }

    // Fetch events from Google Calendar
    const calendar = getCalendarClient(accessToken);
    const now = new Date();
    const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: twoMonthsLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 200,
    });

    const googleEvents = response.data.items || [];
    let imported = 0;

    for (const ge of googleEvents) {
      if (!ge.summary || !ge.start?.dateTime) continue;

      // Check if already imported
      const { data: existing } = await supabase.from("events")
        .select("id")
        .eq("external_id", ge.id!)
        .eq("user_id", user.id)
        .single();

      if (existing) continue;

      await supabase.from("events").insert({
        user_id: user.id,
        title: ge.summary,
        description: ge.description || null,
        location: ge.location || null,
        start_time: ge.start.dateTime,
        end_time: ge.end?.dateTime || ge.start.dateTime,
        all_day: !ge.start.dateTime,
        color: "#3B82F6",
        source: "google",
        external_id: ge.id,
        status: ge.status === "cancelled" ? "cancelled" : "confirmed",
      });
      imported++;
    }

    return NextResponse.json({ imported, total: googleEvents.length });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
