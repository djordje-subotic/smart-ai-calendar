import { createClient } from "@/src/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/src/lib/rate-limit";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Whisper API limit

/**
 * Authenticate from cookies (web) or from Authorization Bearer token (mobile).
 * Mobile apps don't have access to Next.js cookies, so they pass the Supabase
 * access token in the Authorization header instead.
 */
async function getUser(request: Request) {
  // Try cookie-based auth first (web)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  // Fallback: Bearer token auth (mobile)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user: mobileUser } } = await client.auth.getUser(token);
    return mobileUser;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit({
      key: user.id || getClientIp(request),
      scope: "ai-transcribe",
      // Voice gets a tighter budget — each call hits Whisper
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return Response.json(
        { error: "Too many transcription requests.", retryAfter: rl.retryAfter, text: "" },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return Response.json({
        text: "",
        error: "NO_API_KEY",
        message: "Voice transcription requires OPENAI_API_KEY. Add it to .env.local.",
      }, { status: 200 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;
    if (!audio) return Response.json({ error: "No audio file" }, { status: 400 });
    if (audio.size > MAX_AUDIO_BYTES) {
      return Response.json({ error: "Audio file too large (max 25MB)", text: "" }, { status: 413 });
    }

    const whisperForm = new FormData();
    whisperForm.append("file", audio);
    whisperForm.append("model", "whisper-1");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      return Response.json({ error: `Whisper error: ${errText}`, text: "" }, { status: 200 });
    }

    const data = await whisperRes.json();
    return Response.json({ text: data.text || "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message, text: "" }, { status: 200 });
  }
}
