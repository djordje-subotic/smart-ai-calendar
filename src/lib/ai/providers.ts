import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Hybrid AI provider system.
 * - GPT-4o mini for simple/cheap queries
 * - Claude Haiku for complex tasks requiring higher quality
 * Falls back to Claude if OpenAI key is missing.
 */

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export type AIComplexity = "simple" | "complex";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  text: string;
  provider: "claude" | "gpt-4o-mini";
  tokensUsed: number;
  cached: boolean;
}

/**
 * Routes to appropriate model based on complexity.
 * Simple tasks go to GPT-4o mini (cheaper), complex go to Claude (better reasoning).
 */
export async function generateAI(
  messages: AIMessage[],
  system: string,
  complexity: AIComplexity = "simple",
  options: { maxTokens?: number; useCache?: boolean } = {}
): Promise<AIResponse> {
  const maxTokens = options.maxTokens || 1024;

  // For complex tasks, use Claude
  if (complexity === "complex" || !hasOpenAI()) {
    return await callClaude(messages, system, maxTokens, options.useCache ?? true);
  }

  // Simple tasks use GPT-4o mini
  try {
    return await callGPT(messages, system, maxTokens);
  } catch (err) {
    console.error("GPT-4o mini failed, falling back to Claude:", err);
    return await callClaude(messages, system, maxTokens, options.useCache ?? true);
  }
}

async function callClaude(
  messages: AIMessage[],
  system: string,
  maxTokens: number,
  useCache: boolean
): Promise<AIResponse> {
  const client = getAnthropicClient();

  const apiMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Anthropic prompt caching - saves 90% cost on input tokens for cached content
  const systemParam = useCache
    ? [{
        type: "text" as const,
        text: system,
        cache_control: { type: "ephemeral" as const },
      }]
    : system;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    system: systemParam as any,
    messages: apiMessages,
  });

  const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return {
    text,
    provider: "claude",
    tokensUsed,
    cached: !!(response.usage as any)?.cache_read_input_tokens,
  };
}

async function callGPT(
  messages: AIMessage[],
  system: string,
  maxTokens: number
): Promise<AIResponse> {
  const client = getOpenAIClient();
  if (!client) throw new Error("OpenAI not configured");

  const allMessages = [
    { role: "system" as const, content: system },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: maxTokens,
    messages: allMessages,
    response_format: { type: "text" },
  });

  const text = response.choices?.[0]?.message?.content || "";
  const tokensUsed = response.usage?.total_tokens || 0;

  return {
    text,
    provider: "gpt-4o-mini",
    tokensUsed,
    cached: false,
  };
}

/**
 * Simple in-memory query cache for repetitive read-only questions.
 * Keyed by user + normalized query. Expires after 5 minutes.
 */
const queryCache = new Map<string, { response: AIResponse; expiresAt: number }>();

export function getCachedQuery(userId: string, query: string): AIResponse | null {
  const key = `${userId}::${query.toLowerCase().trim()}`;
  const cached = queryCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    queryCache.delete(key);
    return null;
  }
  return { ...cached.response, cached: true };
}

export function setCachedQuery(userId: string, query: string, response: AIResponse, ttlMs: number = 5 * 60 * 1000): void {
  const key = `${userId}::${query.toLowerCase().trim()}`;
  queryCache.set(key, { response, expiresAt: Date.now() + ttlMs });

  // Prevent unbounded growth
  if (queryCache.size > 1000) {
    const oldest = [...queryCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) queryCache.delete(oldest[0]);
  }
}

/**
 * Read-only queries that are safe to cache (don't modify data).
 */
export function isCacheableQuery(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const readOnlyPatterns = [
    "what's today", "whats today", "what do i have today",
    "what's next", "whats next",
    "am i free", "da li sam slobodan",
    "how many events", "koliko imam",
    "read my day", "procitaj mi dan",
    "what's tomorrow", "whats tomorrow",
  ];
  return readOnlyPatterns.some((pattern) => lower.includes(pattern));
}

/**
 * Classify query complexity for routing.
 */
export function classifyComplexity(message: string): AIComplexity {
  const lower = message.toLowerCase().trim();

  // Complex: schedule generation, replan, optimize, multi-step planning
  const complexPatterns = [
    "plan my week", "napravi mi raspored", "plan my day",
    "replan", "reorganize", "reorganizuj",
    "optimize", "optimizuj",
    "generate a full", "generate schedule",
    "weekly report", "nedeljni izvestaj",
    "analyze my",
  ];

  if (complexPatterns.some((p) => lower.includes(p))) return "complex";

  // Simple: single event creation, questions, quick actions
  return "simple";
}
