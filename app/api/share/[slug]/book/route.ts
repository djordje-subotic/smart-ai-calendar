import { createClient } from "@supabase/supabase-js";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/src/lib/rate-limit";
import { sendEmail, bookingGuestEmail, bookingHostEmail } from "@/src/lib/email";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit per IP — anonymous endpoint
    const ip = getClientIp(request);
    const rl = rateLimit({
      key: ip,
      scope: `share-book:${slug}`,
      limit: 8,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many booking attempts. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const { start, end, name, email, notes } = body || {};

    if (!start || !end || !name || !email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }
    if (typeof name !== "string" || name.length > 120) {
      return Response.json({ error: "Invalid name" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
      return Response.json({ error: "Invalid time range" }, { status: 400 });
    }
    if (endDate <= startDate) {
      return Response.json({ error: "End must be after start" }, { status: 400 });
    }
    if (startDate.getTime() < Date.now()) {
      return Response.json({ error: "Slot is in the past" }, { status: 400 });
    }

    const supabase = adminClient();

    const { data: link } = await supabase
      .from("share_links")
      .select("id, user_id, title, duration_minutes, enabled")
      .eq("slug", slug)
      .maybeSingle();

    if (!link || !link.enabled) {
      return Response.json({ error: "Link not found" }, { status: 404 });
    }

    // Guard against double-booking: check if any confirmed booking or event
    // already occupies this window.
    const [{ data: conflictingEvents }, { data: conflictingBookings }] = await Promise.all([
      supabase
        .from("events")
        .select("id")
        .eq("user_id", link.user_id)
        .lt("start_time", endDate.toISOString())
        .gt("end_time", startDate.toISOString())
        .limit(1),
      supabase
        .from("share_link_bookings")
        .select("id")
        .eq("host_user_id", link.user_id)
        .eq("status", "confirmed")
        .lt("start_time", endDate.toISOString())
        .gt("end_time", startDate.toISOString())
        .limit(1),
    ]);

    if ((conflictingEvents && conflictingEvents.length) || (conflictingBookings && conflictingBookings.length)) {
      return Response.json(
        { error: "That slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }

    // Create an event on the host's calendar so it shows up natively
    const { data: event } = await supabase
      .from("events")
      .insert({
        user_id: link.user_id,
        title: `${link.title} — ${name}`,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        description: notes ? `From ${name} <${email}>\n\n${notes}` : `Booked by ${name} <${email}>`,
        color: "#f59e0b",
      })
      .select()
      .single();

    const { error: bookingError } = await supabase.from("share_link_bookings").insert({
      share_link_id: link.id,
      host_user_id: link.user_id,
      event_id: event?.id || null,
      guest_name: name,
      guest_email: email,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      notes: notes || null,
    });

    if (bookingError) {
      console.error("booking insert failed", bookingError);
      // Booking record failed — roll back the event we just created so the
      // host's calendar isn't littered with orphan slots.
      if (event?.id) {
        await supabase.from("events").delete().eq("id", event.id);
      }
      return Response.json({ error: "Could not save booking" }, { status: 500 });
    }

    // Notify the host (in-app)
    await supabase.from("notifications").insert({
      user_id: link.user_id,
      type: "booking_received",
      title: "New booking",
      message: `${name} booked ${startDate.toLocaleString()}`,
      data: { event_id: event?.id, guest_email: email },
    }).then(() => {}, () => {}); // table may not exist in dev; silent fail

    // Email confirmations (fire and forget — failure shouldn't block the booking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://krowna.com";
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", link.user_id)
      .maybeSingle();

    // Email lives on auth.users, not profiles. Use admin API to fetch it.
    let hostEmail: string | null = null;
    try {
      const { data: hostAuth } = await supabase.auth.admin.getUserById(link.user_id);
      hostEmail = hostAuth?.user?.email ?? null;
    } catch {
      // admin API requires service role key; if missing we skip the host email
    }

    const guestMsg = bookingGuestEmail({
      guestName: name,
      hostName: hostProfile?.full_name || undefined,
      start: startDate,
      end: endDate,
      location: null,
      appUrl,
    });
    sendEmail({ to: email, ...guestMsg }).catch(() => {});

    if (hostEmail) {
      const hostMsg = bookingHostEmail({
        guestName: name,
        guestEmail: email,
        start: startDate,
        end: endDate,
        notes: notes || null,
        appUrl,
      });
      sendEmail({ to: hostEmail, ...hostMsg, replyTo: email }).catch(() => {});
    }

    return Response.json({ ok: true }, { headers: rateLimitHeaders(rl) });
  } catch (err) {
    console.error("share/book error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
