import { supabase } from "./supabase";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Wrapper around fetch that auto-attaches the Supabase access token as a
 * Bearer header. Mobile has no cookies, so all server routes need this to
 * authenticate the user (see src/lib/supabase/api-auth.ts on the web side).
 *
 * Pass `path` as a relative path (e.g. "/api/ai/chat") or absolute URL.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  // Don't auto-set Content-Type when caller passed FormData — fetch will
  // add the multipart boundary itself.
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}
