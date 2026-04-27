"use server";

import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildOptimizePrompt } from "@/src/lib/ai/prompts";
import { ParsedEventSchema } from "@/src/lib/ai/schemas";
import { createClient } from "@/src/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  generateAI,
  classifyComplexity,
  isCacheableQuery,
  getCachedQuery,
  setCachedQuery,
} from "@/src/lib/ai/providers";

const PLAN_LIMITS: Record<string, number> = { free: 50, pro: 1000, ultra: 5000 };

/**
 * Auth context that mobile API routes can pass in. When omitted, falls
 * back to the cookie-based session (what server components & web pages use).
 */
export type AuthContext = { user: User; supabase: SupabaseClient };

async function resolveAuth(ctx?: AuthContext): Promise<{ user: User | null; supabase: SupabaseClient }> {
  if (ctx) return ctx;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

async function checkAndTrackUsage(
  action: string,
  tokensUsed: number,
  model: string = "claude-haiku-4-5",
  ctx?: AuthContext,
) {
  const { user, supabase } = await resolveAuth(ctx);
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, ai_credits_used, ai_credits_reset_at, bonus_credits")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const resetAt = new Date(profile.ai_credits_reset_at);
  const now = new Date();
  let creditsUsed = profile.ai_credits_used || 0;
  const bonusCredits = profile.bonus_credits || 0;

  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    creditsUsed = 0;
    await supabase.from("profiles").update({ ai_credits_used: 0, ai_credits_reset_at: now.toISOString() }).eq("id", user.id);
  }

  const limit = PLAN_LIMITS[profile.plan || "free"] || 20;

  if (creditsUsed >= limit) {
    if (bonusCredits > 0) {
      await supabase.from("profiles").update({ bonus_credits: bonusCredits - 1 }).eq("id", user.id);
      await supabase.from("ai_usage_log").insert({ user_id: user.id, action, tokens_used: tokensUsed, model });
      return { creditsUsed, limit, usedBonus: true, bonusRemaining: bonusCredits - 1 };
    }
    throw new Error("LIMIT_REACHED");
  }

  await supabase.from("ai_usage_log").insert({ user_id: user.id, action, tokens_used: tokensUsed, model });
  await supabase.from("profiles").update({ ai_credits_used: creditsUsed + 1 }).eq("id", user.id);

  return { creditsUsed: creditsUsed + 1, limit, usedBonus: false, bonusRemaining: bonusCredits };
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
  meeting_url?: string | null;
}

export interface ChatTask {
  title: string;
  priority: string;
  color: string;
}

export interface ChatAction {
  type: "delete" | "move" | "update";
  event_id: string;
  event_title: string;
  description: string;
  new_start_time?: string;
  new_end_time?: string;
  updates?: {
    title?: string;
    description?: string;
    location?: string;
    color?: string;
  };
}

export interface ChatResponse {
  message: string;
  events?: ChatEvent[];
  tasks?: ChatTask[];
  actions?: ChatAction[];
  usage?: { used: number; limit: number };
}

export async function chatWithAI(
  messages: ChatMessage[],
  timezone: string = "Europe/Belgrade",
  voiceMode: boolean = false,
  ctx?: AuthContext,
): Promise<ChatResponse> {
  const now = new Date().toLocaleString("en-US", { timeZone: timezone });
  const todayISO = new Date().toISOString().split("T")[0];

  // Get user's existing events for context (with IDs for actions)
  const { user, supabase } = await resolveAuth(ctx);
  const { data: existingEvents } = user ? await supabase
    .from("events")
    .select("id, title, start_time, end_time, description, location, color")
    .gte("start_time", new Date(Date.now() - 7 * 86400000).toISOString())
    .lte("start_time", new Date(Date.now() + 30 * 86400000).toISOString())
    .order("start_time")
    .limit(50) : { data: [] };

  // Get user profile for personalization
  const { data: profile } = user ? await supabase
    .from("profiles")
    .select("display_name, city, motivation_style, motto, occupation, bio, goals, daily_habits, hobbies, priorities, constraints, ideal_day, work_schedule, preferences, onboarding_completed, date_of_birth")
    .eq("id", user.id)
    .single() : { data: null };

  // Build profile context section
  let profileContext = "";
  if (profile?.onboarding_completed) {
    const prefs = (profile.preferences as any) || {};
    const workSched = (profile.work_schedule as any) || {};
    const motivationTone: Record<string, string> = {
      strict: "Be a strict but caring coach. Push the user, call out laziness, be direct. Use phrases like 'No excuses', 'You committed to this', 'Let's go, time to work'.",
      friendly: "Be warm, supportive, and encouraging. Celebrate wins, be understanding about setbacks. Use casual, friendly language.",
      professional: "Be clean, efficient, and business-like. No fluff, just clear actionable info. Formal but not cold.",
      hype: "Be MAXIMUM energy! Use exclamation marks, celebrate everything, pump them up. 'LET'S GO!', 'You're crushing it!', 'KING/QUEEN energy!'.",
    };
    profileContext = `
USER IDENTITY:
- Name: ${profile.display_name || "User"}
- Location: ${profile.city || "Not specified"}
- Birthday: ${profile.date_of_birth || "Not provided"}
- Motto: "${profile.motto || ""}"

YOUR PERSONALITY (IMPORTANT — match this tone in ALL responses):
${motivationTone[profile.motivation_style || "friendly"]}
${profile.display_name ? `Address the user as "${profile.display_name}" occasionally.` : ""}
${profile.motto ? `Their personal motto is "${profile.motto}" — reference it when motivating them.` : ""}

USER PROFILE (use this to personalize everything):
- Occupation: ${profile.occupation || "Not specified"}
- Bio: ${profile.bio || "Not provided"}
- Goals: ${(profile.goals as string[] || []).join(", ") || "None"}
- Life priorities: ${(profile.priorities as string[] || []).join(", ") || "None"}
- Daily habits they want: ${(profile.daily_habits as string[] || []).join(", ") || "None"}
- Hobbies & interests: ${(profile.hobbies as string[] || []).join(", ") || "None"}
- Hard constraints/rules: ${(profile.constraints as string[] || []).join(", ") || "None"}
- Ideal day description: ${profile.ideal_day || "Not provided"}
- Work days: ${(workSched.days || []).join(", ")} from ${workSched.start || "09:00"} to ${workSched.end || "17:00"}
- Wake: ${prefs.wake_time || "07:00"}, Lunch: ${prefs.lunch_time || "13:00"}, Sleep: ${prefs.sleep_time || "23:00"}
- Peak focus: ${prefs.focus_preference || "morning"}

PERSONALIZATION RULES:
- Schedule work tasks only during their work hours and work days
- Place habits at smart times (morning workout after wake, reading before sleep, etc.)
- Respect ALL hard constraints — never schedule over them
- Prioritize their life priorities when there are conflicts
- Include their hobbies in free time suggestions
- When generating schedules, follow their ideal day as a template
- Use their focus preference for deep/hard work blocks
- Always leave lunch time free around their lunch preference
- Align ALL suggestions with their goals — if they want to "stay fit", suggest gym time
- If they have a birthday coming up, acknowledge it
`;
  }

  const systemPrompt = `You are Krowna, a premium AI calendar assistant. You have a conversation with the user to help them manage their schedule.

Current date/time: ${now}
Today's date: ${todayISO}
Timezone: ${timezone}
${profileContext}
User's existing events (with IDs for actions):
${JSON.stringify(existingEvents || [], null, 2)}

CAPABILITIES:
1. CREATE events from natural language (single or recurring)
2. CREATE tasks (things to do without a fixed time)
3. GENERATE a full schedule when user describes their ideal week/day
4. ANSWER questions about the user's schedule
5. SUGGEST optimizations and improvements
6. DELETE events (single or bulk) — use "actions" array
7. MOVE events to different times — use "actions" array
8. UPDATE events (title, description, location, color) — use "actions" array

ACTIONS (delete/move/update existing events):
When user wants to delete, move, or modify existing events, use the "actions" array.
- You MUST use the real event "id" from the existing events list above
- For "obrisi sve za danas" / "delete all for today" → add delete actions for each matching event
- For "pomeri X na Y" / "move X to Y" → add move action with new times
- For "promeni boju X" / "change color of X" → add update action
- IMPORTANT: Always include a clear description of what each action does so user can confirm

LANGUAGE SUPPORT (Serbian + English):
- danas=today, sutra=tomorrow, svaki=every, dan=day, od=from, do=to/until
- nedelja=week, mesec=month, ponedeljak=monday, utorak=tuesday, sreda=wednesday
- cetvrtak=thursday, petak=friday, subota=saturday, nedelja=sunday
- ujutru=morning, uvece=evening, popodne=afternoon
- obrisi=delete, pomeri=move, promeni=change, otazi=cancel

TIME INTERPRETATION (CRITICAL):
- Use EXACTLY the number the user says. "u 7" = 07:00, "u 7:30" = 07:30. NEVER add +1 hour or shift the time.
- If the time has already passed today, intelligently use PM: "u 7" at 15:00 = 19:00
- Numbers >= 13 are always 24h format: "u 14" = 14:00, "u 20" = 20:00
- "ujutru" = morning, "uvece" = evening, "popodne" = afternoon

RULES FOR EVENTS:
- ALWAYS include start_time and end_time as ISO 8601 with timezone
- "svaki dan" / "every day" = recurrence {"freq":"daily","interval":1}
- "svaki ponedeljak" = recurrence {"freq":"weekly","interval":1,"days":["MO"]}
- For recurring events, start from TOMORROW
- Default: 1h meetings, 30min tasks/habits
- Use these colors: blue=#3B82F6, red=#EF4444, green=#10B981, amber=#F59E0B, violet=#8B5CF6, pink=#EC4899, cyan=#06B6D4, orange=#F97316
- Pick appropriate colors: work=blue, exercise=green, meals=orange, personal=violet, urgent=red
- MEETING URLs: If user mentions "meeting", "call", "video call", "zoom", "meet", suggest they can add a video link. If they provide a URL, include it in meeting_url field. Set meeting_url to null for non-meeting events.

SCHEDULE GENERATION:
When user says things like "napravi mi raspored" / "plan my week" / "organize my schedule":
- Generate MULTIPLE events covering their described activities
- Spread them across appropriate days and times
- Include breaks, meals, focus time
- Be smart about energy levels (hard work 9-12, meetings 13-16, light work 16-18)
- If user has a profile, personalize based on their goals, habits, and work schedule

TASKS:
When user wants to add a task (something without a specific time), include it in "tasks" array.

RESPONSE FORMAT - ONLY valid JSON, no markdown, no code fences:
{
  "message": "Your conversational response",
  "events": [{"title":"Morning Workout","start_time":"2026-04-17T07:00:00","end_time":"2026-04-17T08:00:00","location":null,"description":null,"recurrence":null,"color":"#10B981","meeting_url":null}],
  "tasks": [{"title":"Buy groceries","priority":"medium","color":"#8B5CF6"}],
  "actions": [{"type":"delete","event_id":"uuid","event_title":"Event Name","description":"Delete 'Event Name' from today"},{"type":"move","event_id":"uuid","event_title":"Event Name","description":"Move 'Event Name' from 10:00 to 14:00","new_start_time":"...","new_end_time":"..."},{"type":"update","event_id":"uuid","event_title":"Event Name","description":"Change color of 'Event Name' to green","updates":{"color":"#10B981"}}]
}

CRITICAL RULES:
- Every event and task MUST have a non-empty "title" field. NEVER use null, "", or "Untitled". If the user doesn't specify a name, infer a descriptive one from context (e.g. user says "add something at 3pm" → title: "Appointment at 3 PM").
- "start_time" and "end_time" MUST be valid ISO 8601 datetime strings, not null.
- "message" MUST be a natural language string, not JSON. Never repeat the JSON in message.
- If nothing to create/modify, use empty arrays. Always be helpful and proactive.
When proposing actions, your message should ask for confirmation like "Da li si siguran?" or "Should I proceed?".${voiceMode ? `

VOICE MODE (IMPORTANT — the user is using voice, possibly without seeing the screen):
- Keep responses SHORT and spoken-friendly (2-3 sentences max). No lists, no formatting.
- When asked "what's next" / "sta je sledece" → read the next upcoming event title and time naturally: "Your next event is Meeting with Alex at 2 PM"
- When asked "read my day" / "procitaj mi dan" / "what do I have today" → summarize all today's events in spoken form: "Today you have 3 events: Standup at 9, Lunch at 1, and Gym at 6 PM"
- When asked "how many events" / "koliko imam" → give a count: "You have 5 events today"
- When asked "am I free at X" / "da li sam slobodan u X" → check and answer: "Yes, you're free at 3 PM" or "No, you have a meeting from 2 to 4"
- When creating events, confirm clearly: "Done! I added Gym at 7 AM tomorrow"
- For actions (delete/move), describe what you'll do and ask for verbal confirmation: "I'll delete your 3 PM meeting. Say yes to confirm."
- NEVER use JSON formatting in the message field — write natural spoken text
- Address the user by name if you know it` : ""}`;

  const apiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Determine complexity for smart routing (GPT-4o mini vs Claude)
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const complexity = classifyComplexity(lastUserMessage);

  // Check query cache for read-only questions
  if (user && isCacheableQuery(lastUserMessage)) {
    const cached = getCachedQuery(user.id, lastUserMessage);
    if (cached) {
      try {
        const parsed = JSON.parse(cached.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
        return {
          message: parsed.message || cached.text,
          events: [],
          tasks: [],
          actions: [],
          usage: { used: 0, limit: 0 },
        };
      } catch { /* fall through */ }
    }
  }

  // Hybrid AI - simple → GPT-4o mini (cheap), complex → Claude (quality)
  const aiResponse = await generateAI(apiMessages, systemPrompt, complexity, {
    maxTokens: 1500,
    useCache: true, // Anthropic prompt caching for repeated system prompts
  });

  const text = aiResponse.text;
  const usage = await checkAndTrackUsage("chat", aiResponse.tokensUsed, aiResponse.provider, ctx);

  // Cache read-only query responses
  if (user && isCacheableQuery(lastUserMessage)) {
    setCachedQuery(user.id, lastUserMessage, aiResponse);
  }

  // Parse response — extract JSON from the AI text, validate critical fields
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Clean events: ensure every event has a real title + valid times
      const events = (Array.isArray(parsed.events) ? parsed.events : []).map(
        (e: Record<string, unknown>) => ({
          ...e,
          title:
            (typeof e.title === "string" && e.title.trim()) ||
            "New Event",
        })
      );

      // Clean tasks: same title guard
      const tasks = (Array.isArray(parsed.tasks) ? parsed.tasks : []).map(
        (t: Record<string, unknown>) => ({
          ...t,
          title:
            (typeof t.title === "string" && t.title.trim()) ||
            "New Task",
        })
      );

      return {
        message: parsed.message || text,
        events,
        tasks,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        usage: { used: usage.creditsUsed, limit: usage.limit },
      };
    } catch { /* fall through */ }
  }

  return { message: text, events: [], tasks: [], actions: [], usage: { used: usage.creditsUsed, limit: usage.limit } };
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
export async function generateDailyBriefing(
  timezone: string = "Europe/Belgrade",
  ctx?: AuthContext,
): Promise<string> {
  const client = getClient();
  const { user, supabase } = await resolveAuth(ctx);
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
      content: `You are Krowna, a premium AI calendar assistant. Give a brief, friendly daily briefing (2-3 sentences max). Current time: ${now}. Today's events: ${JSON.stringify(events || [])}. If no events, suggest planning. Match language of events.`,
    }],
  });

  const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  await checkAndTrackUsage("daily_briefing", totalTokens, "claude-haiku-4-5", ctx);
  return text;
}

// --- USAGE STATS ---
export async function getUsageStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles")
    .select("plan, ai_credits_used, ai_credits_reset_at, energy_profile, bonus_credits")
    .eq("id", user.id).single();

  if (!profile) return null;
  const limit = PLAN_LIMITS[profile.plan || "free"] || 20;
  return {
    plan: profile.plan || "free",
    used: profile.ai_credits_used || 0,
    limit,
    bonus_credits: profile.bonus_credits || 0,
    energy_profile: profile.energy_profile,
  };
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

  const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
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

// --- REPLAN MY DAY (1 AI credit) ---
export interface ReplanResult {
  message: string;
  moves: Array<{ event_title: string; from: string; to: string; reason: string }>;
  adds: Array<{ title: string; time: string; reason: string }>;
  removes: Array<{ event_title: string; reason: string }>;
  usage?: { used: number; limit: number };
}

export async function replanDay(
  reason: string = "I need to reorganize my day",
  timezone: string = "Europe/Belgrade",
  ctx?: AuthContext,
): Promise<ReplanResult> {
  const client = getClient();
  const { user, supabase } = await resolveAuth(ctx);
  if (!user) throw new Error("Not authenticated");

  const today = new Date();
  const now = new Date().toLocaleString("en-US", { timeZone: timezone });
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  const { data: events } = await supabase.from("events")
    .select("title, start_time, end_time, location, status")
    .gte("start_time", startOfDay).lte("start_time", endOfDay).order("start_time");

  const { data: tasks } = await supabase.from("tasks")
    .select("title, due_date, due_time, priority, status")
    .eq("due_date", today.toISOString().split("T")[0]).neq("status", "done");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `You are Krowna, a personal time manager. Current time: ${now}. The user wants to replan their day.

Reason: "${reason}"

Today's events: ${JSON.stringify(events || [])}
Today's remaining tasks: ${JSON.stringify(tasks || [])}

Analyze what's left in the day (skip events that already passed) and suggest a better arrangement.
Consider: energy levels, breaks, task priorities, realistic timing.

Respond with ONLY this JSON:
{
  "message": "Brief friendly summary of what you changed and why (1-2 sentences)",
  "moves": [{"event_title":"...", "from":"HH:mm", "to":"HH:mm", "reason":"..."}],
  "adds": [{"title":"...", "time":"HH:mm", "reason":"..."}],
  "removes": [{"event_title":"...", "reason":"..."}]
}
Empty arrays if no changes needed.`,
    }],
  });

  const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  const usage = await checkAndTrackUsage("replan_day", totalTokens, "claude-haiku-4-5", ctx);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { message: text, moves: [], adds: [], removes: [], usage: { used: usage.creditsUsed, limit: usage.limit } };

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, usage: { used: usage.creditsUsed, limit: usage.limit } };
  } catch {
    return { message: text, moves: [], adds: [], removes: [], usage: { used: usage.creditsUsed, limit: usage.limit } };
  }
}

// --- EXECUTE AI ACTIONS (after user confirms) ---
export async function executeAIActions(actions: ChatAction[]): Promise<{ success: boolean; results: string[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const results: string[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "delete": {
          const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", action.event_id)
            .eq("user_id", user.id);
          if (error) throw error;
          results.push(`Deleted "${action.event_title}"`);
          break;
        }
        case "move": {
          const { error } = await supabase
            .from("events")
            .update({
              start_time: action.new_start_time,
              end_time: action.new_end_time,
              updated_at: new Date().toISOString(),
            })
            .eq("id", action.event_id)
            .eq("user_id", user.id);
          if (error) throw error;
          results.push(`Moved "${action.event_title}"`);
          break;
        }
        case "update": {
          if (!action.updates) break;
          const { error } = await supabase
            .from("events")
            .update({
              ...action.updates,
              updated_at: new Date().toISOString(),
            })
            .eq("id", action.event_id)
            .eq("user_id", user.id);
          if (error) throw error;
          results.push(`Updated "${action.event_title}"`);
          break;
        }
      }
    } catch (err) {
      results.push(`Failed: ${action.event_title} — ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return { success: true, results };
}

// --- WEEKLY AI REPORT ---
export interface WeeklyReport {
  summary: string;
  stats: { total_events: number; total_hours: number; busiest_day: string; emptiest_day: string };
  insights: string[];
  suggestions: string[];
}

export async function generateWeeklyReport(
  timezone: string = "Europe/Belgrade",
  ctx?: AuthContext,
): Promise<WeeklyReport> {
  const client = getClient();
  const { user, supabase } = await resolveAuth(ctx);
  if (!user) throw new Error("Not authenticated");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const { data: events } = await supabase.from("events")
    .select("title, start_time, end_time, color, source")
    .eq("user_id", user.id)
    .gte("start_time", weekAgo.toISOString())
    .lte("start_time", now.toISOString())
    .order("start_time");

  const { data: tasks } = await supabase.from("tasks")
    .select("title, status, priority")
    .eq("user_id", user.id)
    .gte("due_date", weekAgo.toISOString().split("T")[0])
    .lte("due_date", now.toISOString().split("T")[0]);

  const { data: profile } = await supabase.from("profiles")
    .select("display_name, goals, daily_habits")
    .eq("id", user.id).single();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `You are Krowna, a personal time manager. Generate a weekly report.

User: ${profile?.display_name || "User"}
Goals: ${JSON.stringify(profile?.goals || [])}
Habits wanted: ${JSON.stringify(profile?.daily_habits || [])}

Past 7 days events: ${JSON.stringify(events || [])}
Tasks: ${JSON.stringify(tasks || [])}

Respond with ONLY JSON:
{
  "summary": "2-3 sentence friendly summary of their week",
  "stats": {"total_events": N, "total_hours": N, "busiest_day": "Monday", "emptiest_day": "Sunday"},
  "insights": ["insight1", "insight2", "insight3"],
  "suggestions": ["suggestion1", "suggestion2"]
}`,
    }],
  });

  const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  await checkAndTrackUsage("weekly_report", totalTokens, "claude-haiku-4-5", ctx);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  return { summary: text, stats: { total_events: events?.length || 0, total_hours: 0, busiest_day: "N/A", emptiest_day: "N/A" }, insights: [], suggestions: [] };
}

// --- AI MEETING PREP ---
export interface MeetingPrep {
  title: string;
  briefing: string;
  suggested_agenda: string[];
  talking_points: string[];
}

export async function generateMeetingPrep(eventId: string, timezone: string = "Europe/Belgrade"): Promise<MeetingPrep> {
  const client = getClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: event } = await supabase.from("events")
    .select("title, description, location, start_time, end_time, meeting_url")
    .eq("id", eventId).eq("user_id", user.id).single();

  if (!event) throw new Error("Event not found");

  // Get recent events with similar title for context
  const { data: relatedEvents } = await supabase.from("events")
    .select("title, start_time, description")
    .eq("user_id", user.id)
    .ilike("title", `%${event.title.split(" ")[0]}%`)
    .lt("start_time", event.start_time)
    .order("start_time", { ascending: false })
    .limit(3);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `You are Krowna. Generate a quick meeting prep briefing.

Meeting: ${event.title}
Time: ${event.start_time} - ${event.end_time}
Description: ${event.description || "None"}
Location: ${event.location || "None"}
Has video call: ${event.meeting_url ? "Yes" : "No"}

Previous related meetings: ${JSON.stringify(relatedEvents || [])}

Respond with ONLY JSON:
{
  "title": "${event.title}",
  "briefing": "1-2 sentence context about this meeting",
  "suggested_agenda": ["item1", "item2", "item3"],
  "talking_points": ["point1", "point2"]
}`,
    }],
  });

  const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  await checkAndTrackUsage("meeting_prep", totalTokens);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  return { title: event.title, briefing: "No prep available", suggested_agenda: [], talking_points: [] };
}

// --- SMART TEMPLATES ---
export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  events: ChatEvent[];
}

export async function applyTemplate(
  templateId: string,
  startDate: string,
  timezone: string = "Europe/Belgrade"
): Promise<ChatResponse> {
  const templates: Record<string, string> = {
    productive_week: "Plan a highly productive week starting from the given date. Include deep work blocks in the morning, meetings in the afternoon, exercise, breaks, and learning time. Mon-Fri only.",
    study_week: "Plan a study-focused week. Include 3-4 hour study blocks, revision sessions, practice problems, and breaks. Balance with exercise and social time.",
    balanced_week: "Plan a perfectly balanced week. Mix of work, exercise, hobbies, social time, self-care, and rest. Don't overload any day.",
    sprint_week: "Plan an intense sprint week. Maximum productivity: deep work blocks, minimal meetings, quick meals, focused sessions. Include recovery time.",
    vacation_mode: "Plan a relaxing vacation week. Sleep in, leisure activities, exploration, good meals, no work. Include some light exercise.",
  };

  const prompt = templates[templateId];
  if (!prompt) throw new Error("Template not found");

  return chatWithAI([{
    role: "user",
    content: `${prompt} Start date: ${startDate}. Timezone: ${timezone}. Generate the events.`,
  }], timezone);
}

// --- CALENDAR HEATMAP DATA ---
export async function getCalendarHeatmap(year: number, month: number): Promise<Array<{ date: string; count: number; hours: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: events } = await supabase.from("events")
    .select("start_time, end_time")
    .eq("user_id", user.id)
    .gte("start_time", startDate)
    .lte("start_time", endDate);

  if (!events) return [];

  // Group by date
  const byDate: Record<string, { count: number; hours: number }> = {};
  for (const event of events) {
    const date = event.start_time.split("T")[0];
    const durationHours = (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 3600000;
    if (!byDate[date]) byDate[date] = { count: 0, hours: 0 };
    byDate[date].count++;
    byDate[date].hours += durationHours;
  }

  return Object.entries(byDate).map(([date, data]) => ({ date, ...data }));
}

// --- FOCUS MODE ---
export async function startFocusSession(durationMinutes: number = 90, title: string = "Focus Block"): Promise<{ eventId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date();
  const end = new Date(now.getTime() + durationMinutes * 60000);

  const { data, error } = await supabase.from("events").insert({
    user_id: user.id,
    title,
    description: "Focus session — do not disturb",
    start_time: now.toISOString(),
    end_time: end.toISOString(),
    all_day: false,
    color: "#8B5CF6",
    source: "ai",
    status: "confirmed",
    reminder_minutes: [0],
    external_id: null,
    meeting_url: null,
    ai_metadata: { original_prompt: "focus_mode", confidence: 1.0, model_used: "system" },
  }).select().single();

  if (error) throw new Error(error.message);
  return { eventId: data.id };
}
