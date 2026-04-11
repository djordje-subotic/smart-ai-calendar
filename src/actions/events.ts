"use server";

import { createClient } from "@/src/lib/supabase/server";
import { CalendarEvent } from "@/src/types/event";
import { revalidatePath } from "next/cache";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function getEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .lte("start_time", endDate)
    .gte("end_time", startDate)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("getEvents error:", error.message);
    return [];
  }
  return data as CalendarEvent[];
}

export async function createEvent(
  event: Omit<CalendarEvent, "id" | "user_id" | "created_at" | "updated_at">
): Promise<CalendarEvent> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("events")
    .insert({ ...event, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("createEvent error:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/calendar");
  revalidatePath("/today");
  return data as CalendarEvent;
}

export async function updateEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("events")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/today");
  return data as CalendarEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/today");
}
