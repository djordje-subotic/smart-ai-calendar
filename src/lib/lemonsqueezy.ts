/**
 * Lemon Squeezy integration.
 * Merchant of Record — handles VAT, taxes, compliance automatically.
 *
 * Setup steps:
 * 1. Create products in Lemon Squeezy dashboard (one per credit pack + one per plan)
 * 2. Each product has a variant_id — put them in env vars
 * 3. Create webhook in LS dashboard pointing to /api/lemonsqueezy/webhook
 * 4. Copy webhook signing secret to env vars
 */

const LS_API = "https://api.lemonsqueezy.com/v1";

// Map internal package IDs to Lemon Squeezy variant IDs from env
export const LS_VARIANT_IDS = {
  // Credit packs
  pack_150: process.env.LS_VARIANT_PACK_150 || "",
  pack_500: process.env.LS_VARIANT_PACK_500 || "",
  pack_1500: process.env.LS_VARIANT_PACK_1500 || "",
  // Subscription plans
  plan_pro: process.env.LS_VARIANT_PLAN_PRO || "",
  plan_ultra: process.env.LS_VARIANT_PLAN_ULTRA || "",
};

export interface LSCheckoutOptions {
  variantId: string;
  email?: string;
  name?: string;
  custom?: Record<string, string>;
  redirectUrl?: string;
  receiptButtonText?: string;
}

/**
 * Create a Lemon Squeezy checkout session.
 * Returns the checkout URL to redirect the user to.
 */
export async function createLemonSqueezyCheckout(opts: LSCheckoutOptions): Promise<string | null> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    console.warn("Lemon Squeezy not configured (LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID missing)");
    return null;
  }
  if (!opts.variantId) {
    console.warn("Lemon Squeezy variant ID not set for this product");
    return null;
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: opts.email,
          name: opts.name,
          custom: opts.custom || {},
        },
        product_options: {
          redirect_url: opts.redirectUrl,
          receipt_button_text: opts.receiptButtonText || "Back to Krowna",
        },
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
          button_color: "#F59E0B",
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: opts.variantId } },
      },
    },
  };

  try {
    const res = await fetch(`${LS_API}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("LS checkout failed:", err);
      return null;
    }

    const data = await res.json();
    return data.data?.attributes?.url || null;
  } catch (err) {
    console.error("LS checkout error:", err);
    return null;
  }
}

/**
 * Verify webhook signature from Lemon Squeezy.
 * Uses HMAC-SHA256 with the webhook signing secret.
 */
export async function verifyLemonSqueezyWebhook(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) return false;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    // Refuse to accept unsigned webhooks in production — without this guard
    // a missing env var would let attackers forge webhook events to grant
    // themselves credits or change subscription state.
    if (process.env.NODE_ENV === "production") {
      console.error("LEMONSQUEEZY_WEBHOOK_SECRET missing in production — rejecting webhook");
      return false;
    }
    console.warn("LEMONSQUEEZY_WEBHOOK_SECRET not set — webhook verification skipped (DEV ONLY)");
    return true;
  }

  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function isLemonSqueezyConfigured(): boolean {
  return !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
}
