import { generateWeeklyReport } from "@/src/actions/ai";
import { getApiAuth } from "@/src/lib/supabase/api-auth";
import { getClientIp, rateLimit, rateLimitHeaders, RATE_LIMITS } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const auth = await getApiAuth(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit({
      key: auth.user.id || getClientIp(request),
      scope: "ai-weekly-report",
      ...RATE_LIMITS.ai,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many requests.", retryAfter: rl.retryAfter },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const result = await generateWeeklyReport("Europe/Belgrade", auth);
    return Response.json(result, { headers: rateLimitHeaders(rl) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({
      error: message,
      summary: "Could not generate report",
      stats: { total_events: 0, total_hours: 0, busiest_day: "N/A", emptiest_day: "N/A" },
      insights: [], suggestions: [],
    }, { status: 200 });
  }
}
