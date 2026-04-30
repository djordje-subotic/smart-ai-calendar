import { createLemonSqueezyCheckout, LS_VARIANT_IDS, isLemonSqueezyConfigured } from "@/src/lib/lemonsqueezy";
import { createClient } from "@/src/lib/supabase/server";
import { getClientIp, rateLimit, rateLimitHeaders, RATE_LIMITS } from "@/src/lib/rate-limit";

const PACKAGES = [
  { id: "pack_150", credits: 150, priceCents: 299, name: "150 Credits" },
  { id: "pack_500", credits: 500, priceCents: 599, name: "500 Credits" },
  { id: "pack_1500", credits: 1500, priceCents: 1499, name: "1500 Credits" },
];

export async function POST(request: Request) {
  try {
    const { packageId } = await request.json();
    const pack = PACKAGES.find((p) => p.id === packageId);
    if (!pack) return Response.json({ error: "Invalid package" }, { status: 400 });

    // Get authed user for metadata
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const rl = rateLimit({
      key: user.id || getClientIp(request),
      scope: "credits-checkout",
      ...RATE_LIMITS.billing,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many checkout requests.", retryAfter: rl.retryAfter },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Try Lemon Squeezy
    if (isLemonSqueezyConfigured()) {
      const variantId = LS_VARIANT_IDS[packageId as keyof typeof LS_VARIANT_IDS];
      if (!variantId) {
        return Response.json({ error: "Product not configured in Lemon Squeezy" }, { status: 500 });
      }

      const checkoutUrl = await createLemonSqueezyCheckout({
        variantId,
        email: user.email,
        custom: {
          user_id: user.id,
          package_id: pack.id,
          credits: String(pack.credits),
          type: "credits",
        },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings?purchase=success`,
      });

      if (checkoutUrl) {
        return Response.json({ mode: "lemonsqueezy", url: checkoutUrl });
      }
    }

    // Dev fallback — simulated success (adds credits directly). Refuse in
    // production so a misconfigured deploy can't hand out free credits.
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "Payment provider is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const { data: profile } = await supabase.from("profiles").select("bonus_credits").eq("id", user.id).single();
    const current = profile?.bonus_credits || 0;
    const newBalance = current + pack.credits;

    await supabase.from("profiles").update({ bonus_credits: newBalance }).eq("id", user.id);
    await supabase.from("credit_purchases").insert({
      user_id: user.id,
      credits: pack.credits,
      price_cents: pack.priceCents,
      package_id: pack.id,
    });

    return Response.json({
      mode: "simulated",
      packageId: pack.id,
      credits: pack.credits,
      newBalance,
      message: "Simulated purchase (Lemon Squeezy not configured). Credits added directly.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
