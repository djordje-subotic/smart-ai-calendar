import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bookingGuestEmail,
  bookingHostEmail,
  renderEmailShell,
  sendEmail,
  welcomeEmail,
} from "@/src/lib/email";

describe("renderEmailShell", () => {
  it("wraps content in the branded HTML shell", () => {
    const html = renderEmailShell("<p>Hello</p>");
    expect(html).toContain("<p>Hello</p>");
    expect(html).toContain("Kron"); // brand header
    expect(html).toContain("kron.app"); // footer links
  });

  it("includes a CTA button when provided", () => {
    const html = renderEmailShell("<p>Body</p>", {
      ctaUrl: "https://kron.app/calendar",
      ctaLabel: "Open Kron",
    });
    expect(html).toContain("Open Kron");
    expect(html).toContain("https://kron.app/calendar");
  });

  it("omits CTA button when not provided", () => {
    const html = renderEmailShell("<p>Body</p>");
    expect(html).not.toContain("background:#f59e0b;color:#1a1020");
  });

  it("uses the brand dark background for email clients that support it", () => {
    const html = renderEmailShell("<p>Body</p>");
    expect(html).toContain("#0f0b15");
  });
});

describe("welcomeEmail", () => {
  it("greets the user by name when provided", () => {
    const email = welcomeEmail({ name: "Djordje", appUrl: "https://kron.app" });
    expect(email.subject).toMatch(/welcome/i);
    expect(email.html).toContain("Welcome, Djordje");
    expect(email.text).toContain("Djordje");
  });

  it("falls back to generic greeting when name missing", () => {
    const email = welcomeEmail({ appUrl: "https://kron.app" });
    expect(email.html).toContain("Welcome to Kron!");
  });

  it("links back to /calendar", () => {
    const email = welcomeEmail({ appUrl: "https://kron.app" });
    expect(email.html).toContain("https://kron.app/calendar");
  });
});

describe("bookingGuestEmail", () => {
  const start = new Date("2026-04-13T14:00:00Z");
  const end = new Date("2026-04-13T14:30:00Z");

  it("subject contains the booked time", () => {
    const email = bookingGuestEmail({
      guestName: "Alice",
      start,
      end,
      appUrl: "https://kron.app",
    });
    expect(email.subject).toMatch(/Confirmed/i);
  });

  it("includes host name when provided", () => {
    const email = bookingGuestEmail({
      guestName: "Alice",
      hostName: "Bob",
      start,
      end,
      appUrl: "https://kron.app",
    });
    expect(email.html).toContain("Bob");
  });

  it("computes duration in minutes from start/end", () => {
    const email = bookingGuestEmail({
      guestName: "Alice",
      start,
      end,
      appUrl: "https://kron.app",
    });
    expect(email.html).toContain("30 minutes");
  });

  it("addresses the guest by name", () => {
    const email = bookingGuestEmail({
      guestName: "Alice",
      start,
      end,
      appUrl: "https://kron.app",
    });
    expect(email.html).toContain("Hi Alice");
  });

  it("includes location when provided", () => {
    const email = bookingGuestEmail({
      guestName: "Alice",
      start,
      end,
      location: "Conference Room 3",
      appUrl: "https://kron.app",
    });
    expect(email.html).toContain("Conference Room 3");
  });
});

describe("bookingHostEmail", () => {
  const start = new Date("2026-04-13T14:00:00Z");
  const end = new Date("2026-04-13T14:30:00Z");

  it("includes guest name and email", () => {
    const email = bookingHostEmail({
      guestName: "Alice",
      guestEmail: "alice@example.com",
      start,
      end,
      appUrl: "https://kron.app",
    });
    expect(email.html).toContain("Alice");
    expect(email.html).toContain("alice@example.com");
  });

  it("includes notes when provided", () => {
    const email = bookingHostEmail({
      guestName: "Alice",
      guestEmail: "alice@example.com",
      start,
      end,
      notes: "Discuss Q2 strategy",
      appUrl: "https://kron.app",
    });
    expect(email.html).toContain("Discuss Q2 strategy");
  });

  it("omits notes block when not provided", () => {
    const email = bookingHostEmail({
      guestName: "Alice",
      guestEmail: "alice@example.com",
      start,
      end,
      appUrl: "https://kron.app",
    });
    // Should not contain blockquote-style notes
    expect(email.html).not.toContain("background:rgba(255,255,255,0.05)");
  });

  it("links back to /calendar", () => {
    const email = bookingHostEmail({
      guestName: "Alice",
      guestEmail: "alice@example.com",
      start,
      end,
      appUrl: "https://kron.app",
    });
    expect(email.html).toContain("https://kron.app/calendar");
  });
});

describe("sendEmail — dev mode (no API key)", () => {
  const originalKey = process.env.RESEND_API_KEY;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    if (originalKey !== undefined) process.env.RESEND_API_KEY = originalKey;
  });

  it("logs instead of sending when no API key is set", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>body</p>",
    });
    expect(result.ok).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[email] (no RESEND_API_KEY) would send:",
      expect.objectContaining({ to: "test@example.com", subject: "Test" })
    );
  });
});

describe("sendEmail — live mode", () => {
  const originalKey = process.env.RESEND_API_KEY;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key-123";
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey !== undefined) process.env.RESEND_API_KEY = originalKey;
    else delete process.env.RESEND_API_KEY;
  });

  it("POSTs to Resend with correct headers", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "em_abc" }), { status: 200 })
    );
    await sendEmail({ to: "t@ex.com", subject: "S", html: "<p>H</p>" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key-123",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("returns ok:false when Resend responds with an error", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("invalid api key", { status: 401 })
    );
    const result = await sendEmail({ to: "t@ex.com", subject: "S", html: "<p>H</p>" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("401");
  });

  it("returns ok:false when fetch throws", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("network down"));
    const result = await sendEmail({ to: "t@ex.com", subject: "S", html: "<p>H</p>" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("network down");
  });

  it("uses custom from + reply_to when provided", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await sendEmail({
      to: "t@ex.com",
      subject: "S",
      html: "<p>H</p>",
      from: "Custom <custom@kron.app>",
      replyTo: "reply@kron.app",
    });
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.from).toBe("Custom <custom@kron.app>");
    expect(body.reply_to).toBe("reply@kron.app");
  });
});
