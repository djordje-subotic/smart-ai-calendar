import { learnEnergyProfile } from "@/src/actions/energy";
import { createClient } from "@/src/lib/supabase/server";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Cheap endpoint (no LLM call) but still worth a loose limit.
    const rl = rateLimit({
      key: user.id || getClientIp(request),
      scope: "learn-energy",
      limit: 5,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Try again in a moment.", retryAfter: rl.retryAfter },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const result = await learnEnergyProfile();
    return Response.json(result, { headers: rateLimitHeaders(rl) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
