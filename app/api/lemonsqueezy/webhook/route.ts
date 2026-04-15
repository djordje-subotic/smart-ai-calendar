import { verifyLemonSqueezyWebhook } from "@/src/lib/lemonsqueezy";
import { createClient } from "@supabase/supabase-js";

// Use service-role client here — webhooks are server-to-server, no user session.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const valid = await verifyLemonSqueezyWebhook(rawBody, signature);
  if (!valid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName = event.meta?.event_name;
  const custom = event.meta?.custom_data || {};
  const attributes = event.data?.attributes || {};

  try {
    const supabase = getAdminClient();

    switch (eventName) {
      case "order_created": {
        // One-time purchase (credit pack)
        if (custom.type === "credits" && custom.user_id && custom.credits) {
          const userId = custom.user_id as string;
          const credits = parseInt(String(custom.credits), 10);

          const { data: profile } = await supabase
            .from("profiles")
            .select("bonus_credits")
            .eq("id", userId)
            .single();

          const current = profile?.bonus_credits || 0;
          const newBalance = current + credits;

          await supabase.from("profiles").update({ bonus_credits: newBalance }).eq("id", userId);
          await supabase.from("credit_purchases").insert({
            user_id: userId,
            credits,
            price_cents: attributes.total || 0,
            package_id: custom.package_id || "unknown",
          });

          // Notify user
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "credits_purchased",
            title: `${credits} credits added!`,
            message: `Your Krowna account has ${newBalance} bonus credits available.`,
            data: { credits },
          });
        }
        break;
      }

      case "subscription_created":
      case "subscription_resumed":
      case "subscription_updated": {
        // Subscription plan activation (Pro/Ultra)
        if (custom.user_id && custom.plan) {
          const userId = custom.user_id as string;
          const plan = custom.plan as string; // "pro" or "ultra"

          await supabase.from("profiles").update({ plan }).eq("id", userId);

          await supabase.from("notifications").insert({
            user_id: userId,
            type: "plan_activated",
            title: `${plan.toUpperCase()} plan activated!`,
            message: `Welcome to Krowna ${plan.toUpperCase()}. Enjoy premium features.`,
            data: { plan },
          });
        }
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        if (custom.user_id) {
          const userId = custom.user_id as string;
          await supabase.from("profiles").update({ plan: "free" }).eq("id", userId);

          await supabase.from("notifications").insert({
            user_id: userId,
            type: "plan_cancelled",
            title: "Subscription ended",
            message: "Your plan has been downgraded to Free. Your data is safe.",
            data: {},
          });
        }
        break;
      }

      case "subscription_payment_failed": {
        if (custom.user_id) {
          await supabase.from("notifications").insert({
            user_id: custom.user_id as string,
            type: "payment_failed",
            title: "Payment failed",
            message: "We couldn't charge your card. Please update your payment method in Settings.",
            data: {},
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("LS webhook error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
