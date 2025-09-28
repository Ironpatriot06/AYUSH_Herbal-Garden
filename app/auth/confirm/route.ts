// app/auth/confirm/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * When a user clicks the confirmation link:
 * 1) We exchange the code to mark the email as confirmed.
 * 2) Immediately sign the user out (so they are NOT auto-logged-in).
 * 3) Redirect back to /admin with a banner telling them to sign in manually.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const supabase = createRouteHandlerClient({ cookies });

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      // even if exchange fails, continue to admin with a generic message
    }
  }

  // Force manual sign-in after confirmation
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  url.pathname = "/admin";
  url.searchParams.set("confirmed", "1");
  return NextResponse.redirect(url);
}
