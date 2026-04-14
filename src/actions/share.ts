"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ShareLink = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  days_ahead: number;
  earliest_hour: number;
  latest_hour: number;
  include_weekends: boolean;
  timezone: string;
  enabled: boolean;
  created_at: string;
};

function generateSlug(): string {
  // URL-safe, short, collision-resistant enough at our scale.
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function getShareLinks(): Promise<ShareLink[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("share_links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data as ShareLink[]) || [];
}

export async function createShareLink(input: {
  title?: string;
  description?: string;
  duration_minutes?: number;
  days_ahead?: number;
  earliest_hour?: number;
  latest_hour?: number;
  include_weekends?: boolean;
  timezone?: string;
}): Promise<ShareLink | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Retry a few times if slug collides (extremely unlikely).
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("share_links")
      .insert({
        user_id: user.id,
        slug,
        title: input.title || "Book time with me",
        description: input.description || null,
        duration_minutes: input.duration_minutes ?? 30,
        days_ahead: input.days_ahead ?? 14,
        earliest_hour: input.earliest_hour ?? 9,
        latest_hour: input.latest_hour ?? 18,
        include_weekends: input.include_weekends ?? false,
        timezone: input.timezone || "UTC",
      })
      .select()
      .single();

    if (!error && data) {
      revalidatePath("/settings");
      return data as ShareLink;
    }
    // 23505 = unique violation → retry with a new slug
    if (error && error.code !== "23505") {
      console.error("createShareLink failed", error);
      return null;
    }
  }
  return null;
}

export async function updateShareLink(
  id: string,
  patch: Partial<Omit<ShareLink, "id" | "slug" | "created_at">>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("share_links")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  revalidatePath("/settings");
  return data as ShareLink | null;
}

export async function deleteShareLink(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from("share_links").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/settings");
  return { ok: true };
}
