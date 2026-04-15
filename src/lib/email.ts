/**
 * Transactional email wrapper.
 *
 * Uses Resend if `RESEND_API_KEY` is configured; otherwise logs the payload
 * and returns ok so dev flows keep working without a provider.
 *
 * We stick to a tiny HTML template that renders well in Gmail / Apple Mail
 * without pulling in MJML or React Email. Keeping it self-contained so
 * emails can be sent from any server action or webhook handler.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

const DEFAULT_FROM = process.env.EMAIL_FROM || "Krowna <hello@krowna.com>";

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev mode — surface in logs so the user can verify the content flowed
    // through without needing a real provider.
    console.info("[email] (no RESEND_API_KEY) would send:", {
      to: input.to,
      subject: input.subject,
    });
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from || DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const msg = await res.text();
      return { ok: false, error: `resend ${res.status}: ${msg}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "email send failed";
    return { ok: false, error: message };
  }
}

/** Wrap any inner HTML in the branded Krowna shell. */
export function renderEmailShell(content: string, opts?: { ctaUrl?: string; ctaLabel?: string }) {
  const cta = opts?.ctaUrl && opts.ctaLabel
    ? `<div style="margin:28px 0 8px 0"><a href="${opts.ctaUrl}" style="display:inline-block;background:#f59e0b;color:#1a1020;padding:14px 22px;border-radius:12px;font-weight:700;text-decoration:none">${opts.ctaLabel}</a></div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f0b15;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5f0fa">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f0b15;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#17121f;border:1px solid rgba(245,158,11,0.15);border-radius:20px;padding:32px">
            <tr>
              <td>
                <div style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#fbbf24;margin-bottom:24px">Krowna</div>
                <div style="font-size:15px;line-height:1.6;color:#d8d2e4">
                  ${content}
                </div>
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding-top:28px;border-top:1px solid rgba(255,255,255,0.08);margin-top:28px">
                <p style="font-size:11px;color:#8a8497;line-height:1.5;margin:18px 0 0 0">
                  You received this email because you have an account with Krowna.
                  <a href="https://krowna.com/legal/privacy" style="color:#8a8497;text-decoration:underline">Privacy</a> ·
                  <a href="mailto:support@krowna.com" style="color:#8a8497;text-decoration:underline">Contact</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* --- Preset templates --- */

export function welcomeEmail({ name, appUrl }: { name?: string; appUrl: string }) {
  const greeting = name ? `Welcome, ${name}!` : "Welcome to Krowna!";
  const inner = `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 12px 0;color:#fff">${greeting}</h1>
    <p>You just joined the calendar that actually plans your week.</p>
    <p>Here's what to try in your first 5 minutes:</p>
    <ul style="padding-left:18px;margin:12px 0 20px 0">
      <li style="margin:6px 0">Hit ⌘K and say <em>"Plan my productive week."</em></li>
      <li style="margin:6px 0">Add a focus block and Krowna will defend it.</li>
      <li style="margin:6px 0">Connect Google Calendar so everything lives in one place.</li>
    </ul>
  `;
  return {
    subject: "Welcome to Krowna — let's rule your time",
    html: renderEmailShell(inner, { ctaUrl: `${appUrl}/calendar`, ctaLabel: "Open Krowna" }),
    text: `${greeting}\n\nYou just joined Krowna. Open the app to get started: ${appUrl}/calendar`,
  };
}

export function bookingGuestEmail({
  guestName,
  hostName,
  start,
  end,
  location,
  appUrl,
}: {
  guestName: string;
  hostName?: string;
  start: Date;
  end: Date;
  location?: string | null;
  appUrl: string;
}) {
  const formatted = start.toLocaleString(undefined, {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);
  const inner = `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 12px 0;color:#fff">You're booked</h1>
    <p>Hi ${guestName},</p>
    <p>Your meeting${hostName ? ` with <strong>${hostName}</strong>` : ""} is confirmed:</p>
    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:14px;margin:14px 0">
      <div style="font-size:16px;font-weight:700;color:#fff">${formatted}</div>
      <div style="font-size:13px;color:#b4adc2;margin-top:4px">${duration} minutes${location ? ` · ${location}` : ""}</div>
    </div>
    <p>You'll get a calendar invite shortly. Reply to this email if you need to reschedule.</p>
  `;
  return {
    subject: `Confirmed: ${formatted}`,
    html: renderEmailShell(inner, { ctaUrl: `${appUrl}`, ctaLabel: "Visit Krowna" }),
    text: `Your meeting is confirmed for ${formatted}.`,
  };
}

export function bookingHostEmail({
  guestName,
  guestEmail,
  start,
  notes,
  appUrl,
}: {
  guestName: string;
  guestEmail: string;
  start: Date;
  end: Date;
  notes?: string | null;
  appUrl: string;
}) {
  const formatted = start.toLocaleString(undefined, {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const inner = `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 12px 0;color:#fff">New booking on your calendar</h1>
    <p><strong>${guestName}</strong> (${guestEmail}) just booked ${formatted}.</p>
    ${notes ? `<p style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px;margin:12px 0;color:#d8d2e4">"${notes}"</p>` : ""}
    <p>The event is already on your Krowna calendar.</p>
  `;
  return {
    subject: `New booking: ${guestName} · ${formatted}`,
    html: renderEmailShell(inner, { ctaUrl: `${appUrl}/calendar`, ctaLabel: "Open calendar" }),
    text: `${guestName} (${guestEmail}) booked ${formatted}.`,
  };
}
