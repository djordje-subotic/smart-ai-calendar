import { createClient as createCookieClient } from "@/src/lib/supabase/server";
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Resolve the authenticated user for an API route, accepting either:
 *   - cookie session (web)
 *   - `Authorization: Bearer <access_token>` (mobile / external clients)
 *
 * Returns null when neither is present or the token is invalid.
 */
export async function getApiUser(request: Request): Promise<User | null> {
  const supabase = await createCookieClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  const token = extractBearer(request);
  if (!token) return null;

  const tokenClient = bearerClient(token);
  if (!tokenClient) return null;
  const { data: { user: tokenUser } } = await tokenClient.auth.getUser(token);
  return tokenUser ?? null;
}

/**
 * Same as getApiUser but also returns a Supabase client bound to the
 * caller's identity — the cookie client for web, a Bearer-auth client
 * for mobile. Both honour RLS as the user.
 */
export async function getApiAuth(request: Request): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const cookieClient = await createCookieClient();
  const { data: { user: cookieUser } } = await cookieClient.auth.getUser();
  if (cookieUser) return { user: cookieUser, supabase: cookieClient };

  const token = extractBearer(request);
  if (!token) return null;
  const supabase = bearerClient(token);
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  return { user, supabase };
}

function extractBearer(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

function bearerClient(token: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createSupabaseClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}
