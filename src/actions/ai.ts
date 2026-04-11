"use server";

import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildOptimizePrompt } from "@/src/lib/ai/prompts";
import { ParsedEventSchema } from "@/src/lib/ai/schemas";
import { createClient } from "@/src/lib/supabase/server";

const PLAN_LIMITS: Record<string, number> = { free: 20, pro: 500, team: 2000 };

async function checkAndTrackUsage(action: string, tokensUsed: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, ai_credits_used, ai_credits_reset_at")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const resetAt = new Date(profile.ai_credits_reset_at);
  const now = new Date();
  let creditsUsed = profile.ai_credits_used || 0;

  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    creditsUsed = 0;
    await supabase.from("profiles").update({ ai_credits_used: 0, ai_credits_reset_at: now.toISOString() }).eq("id", user.id);
  }

  const limit = PLAN_LIMITS[profile.plan || "free"] || 20;
  if (creditsUsed >= limit) {
    throw new Error(`Monthly AI limit reached (${limit} requests). Upgrade to Pro for more.`);
  }

  await supabase.from("ai_usage_log").insert({ user_id: user.id, action, tokens_used: tokensUsed, model: "claude-haiku-4-5" });
  await supabase.from("profiles").update({ ai_credits_used: creditsUsed + 1 }).eq("id", user.id);

  return { creditsUsed: creditsUsed + 1, limit };
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey });
}

// --- CHAT WITH CONTEXT ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatEvent {
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
  recurrence: { freq: string; interval: number; days?: string[] } | null;
  color: string;
}

export interface ChatTask {
  title: string;
  priority: string;
  color: string;
}

export interface ChatResponse {
  message: string;
  events?: ChatEvent[];
  tasks?: ChatTask[];
  usage?: { used: number; limit: number };
}

export async function chatWithAI(
  messages: ChatMessage[],
  timezone: string = "Europe/Belgrade"
): Promise<ChatResponse> {
  const client = getClient();
  const now = new Date().toLocaleString("en-US", { timeZone: timezone });
  const todayISO = new Date().toISOString().split("T")[0];

  // Get user's existing events for context
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: existingEvents } = user ? await supabase
    .from("events")
    .select("title, start_time, end_time")
    .gte("start_time", new Date(Date.now() - 7 * 86400000).toISOString())
    .lte("start_time", new Date(Date.now() + 30 * 86400000).toISOString())
    .order("start_time")
    .limit(30) : { data: [] };

  const systemPrompt = `You are Kron, a premium AI calendar assistant. You have a conversation with the user to help them manage their schedule.

Current date/time: ${now}
Today's date: ${todayISO}
Timezone: ${timezone}

User's existing events (next 30 days):
${JSON.stringify(existingEvents || [], null, 2)}

CAPABILITIES:
1. CREATE events from natural language (single or recurring)
2. CREATE tasks (things to do without a fixed time)
3. GENERATE a full schedule when user describes their ideal week/day
4. ANSWER questions about the user's schedule
5. SUGGEST optimizations and improvements

LANGUAGE SUPPORT (Serbian + English):
- danas=today, sutra=tomorrow, svaki=every, dan=day, od=from, do=to/until
- nedelja=week, mesec=month, ponedeljak=monday, utorak=tuesday, sreda=wednesday
- cetvrtak=thursday, petak=friday, subota=saturday, nedelja=sunday

RULES FOR EVENTS:
- ALWAYS include start_time and end_time as ISO 8601 with timezone
- "svaki dan" / "every day" = recurrence {"freq":"daily","interval":1}
- "svaki ponedeljak" = recurrence {"freq":"weekly","interval":1,"days":["MO"]}
- For recurring events, start from TOMORROW
- Default: 1h meetings, 30min tasks/habits
- Use these colors: blue=#3B82F6, red=#EF4444, green=#10B981, amber=#F59E0B, violet=#8B5CF6, pink=#EC4899, cyan=#06B6D4, orange=#F97316
- Pick appropriate colors: work=blue, exercise=green, meals=orange, personal=violet, urgent=red

SCHEDULE GENERATION:
When user says things like "napravi mi raspored" / "plan my week" / "organize my schedule":
- Generate MULTIPLE events covering their described activities
- Spread them across appropriate days and times
- Include breaks, meals, focus time
- Be smart about energy levels (hard work 9-12, meetings 13-16, light work 16-18)

TASKS:
When user wants to add a task (something without a specific time), include it in "tasks" array.

RESPONSE FORMAT - ONLY JSON, no markdown:
{
  "message": "Your conversational response",
  "events": [{"title":"...","start_time":"...","end_time":"...","location":null,"description":null,"recurrence":null,"color":"#3B82F6"}],
  "tasks": [{"title":"...","priority":"medium","color":"#8B5CF6"}]
}

If nothing to create, use empty arrays. Always be helpful and proactive.`;

  const apiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: apiMessages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  const usage = await checkAndTrackUsage("chat", totalTokens);

  // Parse response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        message: parsed.message || text,
        events: Array.isArray(parsed.events) ? parsed.events : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        usage: { used: usage.creditsUsed, limit: usage.limit },
      };
    } catch { /* fall through */ }
  }

  return { message: text, events: [], usage: { used: usage.creditsUsed, limit: usage.limit } };
}

// --- SIMPLE PARSE (kept for backward compat) ---
export async function parseEventPrompt(
  userMessage: string,
  timezone: string = "Europe/Belgrade"
) {
  const result = await chatWithAI([{ role: "user", content: userMessage }], timezone);

  if (result.events && result.events.length > 0) {
    const e = result.events[0];
    return {
      title: e.title || "Untitled",
      start_time: e.start_time || new Date().toISOString(),
      end_time: e.end_time || new Date(Date.now() + 3600000).toISOString(),
      location: e.location,
      description: e.description,
      recurrence: e.recurrence && ["daily", "weekly", "monthly", "yearly"].includes(e.recurrence.freq)
        ? { freq: e.recurrence.freq as "daily" | "weekly" | "monthly" | "yearly", interval: e.recurrence.interval || 1, days: e.recurrence.days }
        : null,
      confidence: 0.9,
      needs_clarification: null,
      color: e.color || "#3B82F6",
      usage: result.usage,
    };
  }

  return {
    title: "Untitled",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    location: null,
    description: null,
    recurrence: null,
    confidence: 0.3,
    needs_clarification: result.message,
    color: "#3B82F6",
    usage: result.usage,
  };
}

// --- DAILY BRIEFING ---
export async function generateDailyBriefing(timezone: string = "Europe/Belgrade"): Promise<string> {
  const client = getClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  const { data: events } = await supabase.from("events")
    .select("title, start_time, end_time, location")
    .gte("start_time", startOfDay).lte("start_time", endOfDay).order("start_time");

  const now = new Date().toLocaleString("en-US", { timeZone: timezone });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `You are Kron, a premium AI calendar assistant. Give a brief, friendly daily briefing (2-3 sentences max). Current time: ${now}. Today's events: ${JSON.stringify(events || [])}. If no events, suggest planning. Match language of events.`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  await checkAndTrackUsage("daily_briefing", totalTokens);
  return text;
}

// --- USAGE STATS ---
export async function getUsageStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles")
    .select("plan, ai_credits_used, ai_credits_reset_at, energy_profile")
    .eq("id", user.id).single();

  if (!profile) return null;
  const limit = PLAN_LIMITS[profile.plan || "free"] || 20;
  return { plan: profile.plan || "free", used: profile.ai_credits_used || 0, limit, energy_profile: profile.energy_profile };
}

// --- OPTIMIZE SCHEDULE ---
export interface OptimizeSuggestion { type: "move" | "add" | "remove" | "tip"; event_title?: string; title?: string; reason: string; suggested_time?: string; }
export interface OptimizeResult { analysis: string; score: number; suggestions: OptimizeSuggestion[]; }

export async function optimizeSchedule(userRequest: string, startDate: string, endDate: string, timezone: string = "Europe/Belgrade"): Promise<OptimizeResult & { usage?: { used: number; limit: number } }> {
  const client = getClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!profile || profile.plan === "free") throw new Error("Schedule optimization requires Pro plan. Upgrade in Settings.");

  const { data: events } = await supabase.from("events")
    .select("title, start_time, end_time, location, description")
    .gte("start_time", startDate).lte("start_time", endDate).order("start_time");

  const now = new Date().toLocaleString("en-US", { timeZone: timezone });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: buildOptimizePrompt({ currentDateTime: now, timezone, events: JSON.stringify(events || []), userRequest }),
    messages: [{ role: "user", content: "Analyze and optimize. JSON only." }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  const usage = await checkAndTrackUsage("optimize_schedule", totalTokens);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { analysis: text, score: 50, suggestions: [], usage: { used: usage.creditsUsed, limit: usage.limit } };

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, usage: { used: usage.creditsUsed, limit: usage.limit } };
  } catch {
    return { analysis: text, score: 50, suggestions: [], usage: { used: usage.creditsUsed, limit: usage.limit } };
  }
}
