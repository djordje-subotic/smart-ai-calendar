import { replanDay } from "@/src/actions/ai";
import { createClient } from "@/src/lib/supabase/server";
import { getClientIp, rateLimit, rateLimitHeaders, RATE_LIMITS } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit({
      key: user.id || getClientIp(request),
      scope: "ai-replan",
      ...RATE_LIMITS.ai,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many requests.", retryAfter: rl.retryAfter },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const result = await replanDay();
    return Response.json(result, { headers: rateLimitHeaders(rl) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "LIMIT_REACHED" ? 402 : 500;
    return Response.json({ error: message, moves: [], adds: [], removes: [] }, { status });
  }
}
