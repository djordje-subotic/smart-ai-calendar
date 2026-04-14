import { afterEach, beforeEach, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import {
  isLemonSqueezyConfigured,
  verifyLemonSqueezyWebhook,
} from "@/src/lib/lemonsqueezy";

const SECRET = "test-webhook-secret-abc123";
const PAYLOAD = JSON.stringify({
  meta: { event_name: "order_created", custom_data: { user_id: "u-1" } },
  data: { id: "ord-1", attributes: { total: 199 } },
});

function sign(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyLemonSqueezyWebhook", () => {
  const originalSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    if (originalSecret !== undefined) process.env.LEMONSQUEEZY_WEBHOOK_SECRET = originalSecret;
    else delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  });

  it("accepts a valid HMAC-SHA256 signature", async () => {
    const sig = sign(PAYLOAD, SECRET);
    await expect(verifyLemonSqueezyWebhook(PAYLOAD, sig)).resolves.toBe(true);
  });

  it("rejects when signature does not match payload", async () => {
    const sig = sign(PAYLOAD, SECRET);
    const tampered = PAYLOAD.replace('"u-1"', '"u-2"');
    await expect(verifyLemonSqueezyWebhook(tampered, sig)).resolves.toBe(false);
  });

  it("rejects when signed with the wrong secret", async () => {
    const sig = sign(PAYLOAD, "different-secret");
    await expect(verifyLemonSqueezyWebhook(PAYLOAD, sig)).resolves.toBe(false);
  });

  it("rejects when signature is null", async () => {
    await expect(verifyLemonSqueezyWebhook(PAYLOAD, null)).resolves.toBe(false);
  });

  it("rejects when signature is empty string", async () => {
    await expect(verifyLemonSqueezyWebhook(PAYLOAD, "")).resolves.toBe(false);
  });

  it("rejects when signature has wrong length (timingSafeEqual guard)", async () => {
    await expect(verifyLemonSqueezyWebhook(PAYLOAD, "deadbeef")).resolves.toBe(false);
  });

  it("allows in dev when webhook secret is not set", async () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    await expect(verifyLemonSqueezyWebhook(PAYLOAD, "any-sig")).resolves.toBe(true);
  });

  it("is case-sensitive about the signature encoding", async () => {
    const sig = sign(PAYLOAD, SECRET).toUpperCase();
    // Hex is case-insensitive semantically but timingSafeEqual compares bytes
    await expect(verifyLemonSqueezyWebhook(PAYLOAD, sig)).resolves.toBe(false);
  });
});

describe("isLemonSqueezyConfigured", () => {
  const originalApi = process.env.LEMONSQUEEZY_API_KEY;
  const originalStore = process.env.LEMONSQUEEZY_STORE_ID;

  afterEach(() => {
    if (originalApi !== undefined) process.env.LEMONSQUEEZY_API_KEY = originalApi;
    else delete process.env.LEMONSQUEEZY_API_KEY;
    if (originalStore !== undefined) process.env.LEMONSQUEEZY_STORE_ID = originalStore;
    else delete process.env.LEMONSQUEEZY_STORE_ID;
  });

  it("returns false when API key is missing", () => {
    delete process.env.LEMONSQUEEZY_API_KEY;
    process.env.LEMONSQUEEZY_STORE_ID = "12345";
    expect(isLemonSqueezyConfigured()).toBe(false);
  });

  it("returns false when store ID is missing", () => {
    process.env.LEMONSQUEEZY_API_KEY = "sk_test_123";
    delete process.env.LEMONSQUEEZY_STORE_ID;
    expect(isLemonSqueezyConfigured()).toBe(false);
  });

  it("returns true only when both are set", () => {
    process.env.LEMONSQUEEZY_API_KEY = "sk_test_123";
    process.env.LEMONSQUEEZY_STORE_ID = "12345";
    expect(isLemonSqueezyConfigured()).toBe(true);
  });

  it("returns false when both are empty strings", () => {
    process.env.LEMONSQUEEZY_API_KEY = "";
    process.env.LEMONSQUEEZY_STORE_ID = "";
    expect(isLemonSqueezyConfigured()).toBe(false);
  });
});
