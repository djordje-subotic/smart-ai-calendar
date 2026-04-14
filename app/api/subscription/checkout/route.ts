import { createLemonSqueezyCheckout, LS_VARIANT_IDS, isLemonSqueezyConfigured } from "@/src/lib/lemonsqueezy";
import { createClient } from "@/src/lib/supabase/server";
import { getClientIp, rateLimit, rateLimitHeaders, RATE_LIMITS } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();
    if (plan !== "pro" && plan !== "ultra") {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const rl = rateLimit({
      key: user.id || getClientIp(request),
      scope: "sub-checkout",
      ...RATE_LIMITS.billing,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many checkout requests.", retryAfter: rl.retryAfter },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    if (!isLemonSqueezyConfigured()) {
      // Dev fallback - directly upgrade plan
      await supabase.from("profiles").update({ plan }).eq("id", user.id);
      return Response.json({ mode: "simulated", plan, message: "Plan upgraded (dev mode)" });
    }

    const variantId = plan === "pro" ? LS_VARIANT_IDS.plan_pro : LS_VARIANT_IDS.plan_ultra;
    if (!variantId) {
      return Response.json({ error: "Plan not configured in Lemon Squeezy" }, { status: 500 });
    }

    const checkoutUrl = await createLemonSqueezyCheckout({
      variantId,
      email: user.email,
      custom: { user_id: user.id, plan, type: "subscription" },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings?upgrade=success`,
    });

    if (!checkoutUrl) {
      return Response.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    return Response.json({ mode: "lemonsqueezy", url: checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
