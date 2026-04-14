import { chatWithAI, type ChatMessage } from "@/src/actions/ai";
import { createClient } from "@/src/lib/supabase/server";
import { getClientIp, rateLimit, rateLimitHeaders, RATE_LIMITS } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit({
      key: user.id || getClientIp(request),
      scope: "ai-chat",
      ...RATE_LIMITS.ai,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many requests. Please wait a moment.", retryAfter: rl.retryAfter },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { messages, timezone, voiceMode } = await request.json();
    const result = await chatWithAI(messages as ChatMessage[], timezone || "Europe/Belgrade", voiceMode || false);
    return Response.json(result, { headers: rateLimitHeaders(rl) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 400 });
  }
}
