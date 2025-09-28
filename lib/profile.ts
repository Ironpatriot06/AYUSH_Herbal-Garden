// lib/profile.ts
import { getBrowserSupabase } from "@/lib/supabaseClient";

export type AppProfile = {
  id: string; // same as auth user id (uuid)
  display_name?: string | null;
  role?: "admin" | "user" | string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function fetchCurrentProfile(): Promise<AppProfile | null> {
  try {
    const supabase = getBrowserSupabase();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return null;

    // 👇 Drop the generic from .from(), use .returns<AppProfile>() instead
    const { data: profile, error } = await supabase
      .from("app_profiles")
      .select("id, display_name, role, avatar_url, bio, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle()
      .returns<AppProfile>(); // 👈 fix type inference

    if (error) {
      console.warn("fetchCurrentProfile error:", error);
      return null;
    }

    return profile ?? null;
  } catch (e) {
    console.error("fetchCurrentProfile exception:", e);
    return null;
  }
}
