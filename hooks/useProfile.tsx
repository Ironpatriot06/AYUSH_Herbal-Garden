// hooks/useProfile.tsx
"use client";

import { useEffect, useState } from "react";
import type { AppProfile } from "@/lib/profile";
import { fetchCurrentProfile } from "@/lib/profile";

export function useProfile() {
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const p = await fetchCurrentProfile();
      if (!mounted) return;
      setProfile(p);
      setLoading(false);
    }
    load();

    // optional: subscribe to auth changes to reload profile on signin/signout
    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = profile?.role === "admin";

  return { profile, loading, isAdmin };
}
