"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Plan = "free" | "pro" | "ultra";

const PLAN_DETAILS: Record<Plan, { name: string; price: number }> = {
  free: { name: "Free", price: 0 },
  pro: { name: "Pro", price: 9.99 },
  ultra: { name: "Ultra", price: 19.99 },
};

const LS_API = "https://api.lemonsqueezy.com/v1";

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

/**
 * Cancel the user's Lemon Squeezy subscription.
 *
 * Flow:
 *   1. Look up the stored LS subscription ID on the user's profile.
 *   2. Call LS DELETE /v1/subscriptions/{id} — LS marks the subscription as
 *      cancelled but keeps it active until the end of the current billing
 *      period (default LS behavior — no pro-rated refunds).
 *   3. LS sends `subscription_cancelled` immediately and then
 *      `subscription_expired` at the end of the period. Our webhook handler
 *      downgrades `profiles.plan` on `subscription_expired`.
 *
 * Fallback: if no LS subscription id is stored (dev mode or manual override),
 * we just flip the plan locally so the UI reflects the cancel.
 */
export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("ls_subscription_id")
    .eq("id", user.id)
    .single();

  const lsSubscriptionId = (profile as { ls_subscription_id?: string } | null)?.ls_subscription_id;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!lsSubscriptionId || !apiKey) {
    await supabase.from("profiles").update({ plan: "free" }).eq("id", user.id);
    revalidatePath("/settings");
    return { success: true };
  }

  try {
    const res = await fetch(`${LS_API}/subscriptions/${lsSubscriptionId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok && res.status !== 204) {
      const errText = await res.text().catch(() => "");
      return { success: false, error: `Lemon Squeezy cancel failed: ${res.status} ${errText}` };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    return { success: false, error: message };
  }
}
