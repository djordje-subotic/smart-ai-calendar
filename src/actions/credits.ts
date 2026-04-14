"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CREDIT_PACKAGES } from "@/src/constants/credits";

export async function getBonusCredits(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("profiles")
    .select("bonus_credits")
    .eq("id", user.id)
    .single();

  return data?.bonus_credits || 0;
}

export async function purchaseCredits(packageId: string): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, newBalance: 0, error: "Not authenticated" };

  const pack = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pack) return { success: false, newBalance: 0, error: "Invalid package" };

  // In production this would go through Stripe first.
  // For now we directly add credits (simulating successful payment).

  const { data: profile } = await supabase
    .from("profiles")
    .select("bonus_credits")
    .eq("id", user.id)
    .single();

  const current = profile?.bonus_credits || 0;
  const newBalance = current + pack.credits;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ bonus_credits: newBalance })
    .eq("id", user.id);

  if (updateError) return { success: false, newBalance: current, error: updateError.message };

  // Log purchase
  await supabase.from("credit_purchases").insert({
    user_id: user.id,
    credits: pack.credits,
    price_cents: pack.priceCents,
    package_id: pack.id,
  });

  revalidatePath("/settings");
  return { success: true, newBalance };
}

export async function getPurchaseHistory(): Promise<Array<{ credits: number; price_cents: number; created_at: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("credit_purchases")
    .select("credits, price_cents, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return data || [];
}
