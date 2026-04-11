import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/src/lib/google-calendar";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", request.url));
  }

  try {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Store tokens
    await supabase.from("profiles").update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
      google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      google_calendar_synced: true,
    }).eq("id", user.id);

    return NextResponse.redirect(new URL("/settings?google=connected", request.url));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/settings?error=oauth_failed", request.url));
  }
}
