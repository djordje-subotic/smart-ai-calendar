import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { computeAvailability, type BusyWindow } from "@/src/lib/availability";
import { BookingClient } from "./BookingClient";

export const revalidate = 60; // cache ISR for 1 min

// Public page — uses anon key, relies on RLS to expose only enabled links
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = publicClient();
  const { data: link } = await supabase
    .from("share_links")
    .select("title, description")
    .eq("slug", slug)
    .eq("enabled", true)
    .maybeSingle();

  if (!link) return { title: "Link not found" };
  return {
    title: link.title,
    description: link.description || "Pick a time that works for you.",
  };
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = publicClient();

  const { data: link } = await supabase
    .from("share_links")
    .select("*")
    .eq("slug", slug)
    .eq("enabled", true)
    .maybeSingle();

  if (!link) notFound();

  // Pull host's busy windows for the availability horizon. Only start/end
  // times are exposed — never titles or notes.
  const horizonEnd = new Date(Date.now() + (link.days_ahead + 1) * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // We need a service-role read for busy times (event rows are not public).
  // Fall back to empty if service role isn't configured — slots still render,
  // just without conflict detection.
  let busy: BusyWindow[] = [];
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const [{ data: events }, { data: bookings }] = await Promise.all([
      admin
        .from("events")
        .select("start_time, end_time")
        .eq("user_id", link.user_id)
        .gte("start_time", now)
        .lte("start_time", horizonEnd),
      admin
        .from("share_link_bookings")
        .select("start_time, end_time")
        .eq("host_user_id", link.user_id)
        .eq("status", "confirmed")
        .gte("start_time", now),
    ]);

    busy = [
      ...(events || []).map((e) => ({
        start: new Date(e.start_time),
        end: new Date(e.end_time),
      })),
      ...(bookings || []).map((b) => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time),
      })),
    ];
  }

  const slotsByDay = computeAvailability(busy, {
    durationMinutes: link.duration_minutes,
    daysAhead: link.days_ahead,
    earliestHour: link.earliest_hour,
    latestHour: link.latest_hour,
    includeWeekends: link.include_weekends,
  });

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
            {link.duration_minutes} min meeting
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{link.title}</h1>
          {link.description && (
            <p className="mt-3 text-sm text-muted-foreground">{link.description}</p>
          )}
        </div>

        <BookingClient slug={link.slug} slotsByDay={slotsByDay} durationMinutes={link.duration_minutes} />

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Kron</span>
        </p>
      </div>
    </div>
  );
}
