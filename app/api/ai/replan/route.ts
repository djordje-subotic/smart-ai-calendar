import { replanDay } from "@/src/actions/ai";
import { getApiAuth } from "@/src/lib/supabase/api-auth";
import { getClientIp, rateLimit, rateLimitHeaders, RATE_LIMITS } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const auth = await getApiAuth(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit({
      key: auth.user.id || getClientIp(request),
      scope: "ai-replan",
      ...RATE_LIMITS.ai,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many requests.", retryAfter: rl.retryAfter },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const result = await replanDay("I need to reorganize my day", "Europe/Belgrade", auth);
    return Response.json(result, { headers: rateLimitHeaders(rl) });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: errMsg, message: "", moves: [], adds: [], removes: [] }, { status: 200 });
  }
}
