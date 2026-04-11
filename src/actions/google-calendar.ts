"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getAuthUrl } from "@/src/lib/google-calendar";
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
