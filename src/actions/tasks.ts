"use server";

import { createClient } from "@/src/lib/supabase/server";
import { Task } from "@/src/types/task";
import { revalidatePath } from "next/cache";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) return [];
  return data as Task[];
}

export async function createTask(
  task: Pick<Task, "title" | "description" | "due_date" | "due_time" | "duration_minutes" | "priority" | "color">
): Promise<Task> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...task, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  return data as Task;
}

export async function updateTaskStatus(id: string, status: Task["status"]): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function deleteTask(id: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}
