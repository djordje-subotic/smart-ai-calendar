"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Plan = "free" | "pro" | "ultra";

const PLAN_DETAILS: Record<Plan, { name: string; price: number }> = {
  free: { name: "Free", price: 0 },
  pro: { name: "Pro", price: 9 },
  ultra: { name: "Ultra", price: 19 },
};

export async function getCurrentPlan(): Promise<{ plan: Plan; name: string; price: number } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const plan = (data?.plan || "free") as Plan;
  return { plan, ...PLAN_DETAILS[plan] };
}

export async function changePlan(newPlan: Plan): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update({ plan: newPlan }).eq("id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  return changePlan("free");
}
