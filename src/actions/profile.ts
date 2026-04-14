"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  avatar_preset: string | null;
  date_of_birth: string | null;
  city: string | null;
  motivation_style: "strict" | "friendly" | "professional" | "hype";
  motto: string | null;
  occupation: string | null;
  bio: string | null;
  goals: string[];
  daily_habits: string[];
  hobbies: string[];
  priorities: string[];
  constraints: string[];
  ideal_day: string | null;
  work_schedule: {
    days: string[];
    start: string;
    end: string;
  };
  preferences: {
    language?: string;
    wake_time?: string;
    sleep_time?: string;
    lunch_time?: string;
    focus_preference?: "morning" | "afternoon" | "evening";
  };
  onboarding_completed: boolean;
}

const PROFILE_COLUMNS = "display_name, avatar_url, avatar_preset, date_of_birth, city, motivation_style, motto, occupation, bio, goals, daily_habits, hobbies, priorities, constraints, ideal_day, work_schedule, preferences, onboarding_completed";

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    display_name: data.display_name || null,
    avatar_url: data.avatar_url || null,
    avatar_preset: data.avatar_preset || null,
    date_of_birth: data.date_of_birth || null,
    city: data.city || null,
    motivation_style: data.motivation_style || "friendly",
    motto: data.motto || null,
    occupation: data.occupation || null,
    bio: data.bio || null,
    goals: data.goals || [],
    daily_habits: data.daily_habits || [],
    hobbies: data.hobbies || [],
    priorities: data.priorities || [],
    constraints: data.constraints || [],
    ideal_day: data.ideal_day || null,
    work_schedule: data.work_schedule || { days: ["MO", "TU", "WE", "TH", "FR"], start: "09:00", end: "17:00" },
    preferences: data.preferences || {},
    onboarding_completed: data.onboarding_completed || false,
  };
}

export async function saveUserProfile(profile: Partial<UserProfile>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      ...profile,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/today");
  revalidatePath("/calendar");
  revalidatePath("/profile");
  return { success: true };
}

export async function uploadAvatar(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("avatar") as File;
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop();
  const filePath = `avatars/${user.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, avatar_preset: null })
    .eq("id", user.id);

  revalidatePath("/profile");
  return publicUrl;
}
