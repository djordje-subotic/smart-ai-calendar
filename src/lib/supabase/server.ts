import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // Mobile clients can't send cookies — they pass the Supabase access token
  // in an Authorization: Bearer header. We forward it as a global header so
  // RLS-protected queries get authenticated as the right user.
  let bearerToken: string | null = null;
  try {
    const headerStore = await headers();
    const auth = headerStore.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      bearerToken = auth.slice(7);
    }
  } catch {
    // headers() throws when called outside a request scope
    // (e.g. RSC during build). Cookies-only is fine in that case.
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
      ...(bearerToken
        ? {
            global: {
              headers: { Authorization: `Bearer ${bearerToken}` },
            },
          }
        : {}),
    }
  );
}
