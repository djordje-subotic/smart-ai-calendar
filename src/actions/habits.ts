"use server";

import { createClient } from "@/src/lib/supabase/server";
import { Habit, HabitCompletion } from "@/src/types/habit";
import { revalidatePath } from "next/cache";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function getHabits(): Promise<Habit[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data as Habit[];
}

export async function createHabit(
  habit: Pick<Habit, "name" | "description" | "frequency" | "target_days" | "preferred_time" | "duration_minutes" | "color">
): Promise<Habit> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("habits")
    .insert({ ...habit, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  return data as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("habits")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/habits");
}

export async function getCompletions(habitId: string, month: string): Promise<HabitCompletion[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("habit_completions")
    .select("*")
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .gte("completed_date", `${month}-01`)
    .lte("completed_date", `${month}-31`);

  return (data || []) as HabitCompletion[];
}

export async function toggleCompletion(habitId: string, date: string): Promise<boolean> {
  const { supabase, user } = await getAuthUser();

  // Verify habit ownership
  const { data: habit } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();

  if (!habit) throw new Error("Habit not found");

  const { data: existing } = await supabase
    .from("habit_completions")
    .select("id")
    .eq("habit_id", habitId)
    .eq("completed_date", date)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("habit_completions").delete().eq("id", existing.id);
    await updateStreak(supabase, habitId);
    revalidatePath("/habits");
    return false;
  } else {
    await supabase.from("habit_completions").insert({
      habit_id: habitId,
      user_id: user.id,
      completed_date: date,
    });
    await updateStreak(supabase, habitId);
    revalidatePath("/habits");
    return true;
  }
}

async function updateStreak(supabase: any, habitId: string) {
  const { data: completions } = await supabase
    .from("habit_completions")
    .select("completed_date")
    .eq("habit_id", habitId)
    .order("completed_date", { ascending: false });

  if (!completions || completions.length === 0) {
    await supabase.from("habits").update({ streak_current: 0 }).eq("id", habitId);
    return;
  }

  let streak = 0;
  const today = new Date();
  let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const c of completions) {
    const completedDate = new Date(c.completed_date + "T00:00:00");
    const diff = Math.round((checkDate.getTime() - completedDate.getTime()) / 86400000);

    if (diff <= 1) {
      streak++;
      checkDate = completedDate;
    } else {
      break;
    }
  }

  const { data: habit } = await supabase.from("habits").select("streak_best").eq("id", habitId).single();
  const best = Math.max(streak, habit?.streak_best || 0);

  await supabase.from("habits").update({ streak_current: streak, streak_best: best }).eq("id", habitId);
}
