/**
 * Authenticated fetch helper for the Krowna web API.
 *
 * Mobile clients can't share Next.js cookies with the web app, so every
 * request to a Supabase-protected route needs the user's access token in
 * an `Authorization: Bearer <token>` header. Centralising it here keeps
 * the call sites simple and avoids 401s from missing auth.
 */

import { supabase } from "./supabase";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const auth = await authHeaders();
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const baseHeaders: Record<string, string> = isFormData
    ? {}
    : { "Content-Type": "application/json" };
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...baseHeaders,
      ...auth,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}
