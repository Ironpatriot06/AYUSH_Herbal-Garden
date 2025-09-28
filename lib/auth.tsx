// lib/auth.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export type AdminUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

type AuthContextType = {
  user: AdminUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(u: User): AdminUser {
  const metadata = (u.user_metadata ?? {}) as Record<string, any>;
  const name =
    (metadata?.full_name as string) ??
    (metadata?.name as string) ??
    (u.email as string | null) ??
    null;

  const avatar =
    (metadata?.avatar_url as string) ??
    (metadata?.picture as string) ??
    null;

  return {
    id: u.id,
    email: u.email ?? null,
    name,
    avatar_url: avatar,
    role: null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | null = null;

    async function init() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (currentUser) {
          setUser(mapSupabaseUser(currentUser));
          // fetch("/api/create-profile", { method: "POST" }).catch(() => {});
        } else {
          setUser(null);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Auth init error:", e);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u ? mapSupabaseUser(u) : null);

      if (event === "SIGNED_IN") {
        // fetch("/api/create-profile", { method: "POST" }).catch(() => {});
        try {
          router.refresh();
        } catch {}
      } else if (event === "SIGNED_OUT") {
        try {
          router.push("/");
        } catch {}
      }
    });

    unsub =
      data && (data as any).subscription && typeof (data as any).subscription.unsubscribe === "function"
        ? () => (data as any).subscription.unsubscribe()
        : null;

    return () => {
      mounted = false;
      if (unsub) {
        try {
          unsub();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  const loginWithGoogle = useCallback(async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/admin`,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Google sign-in error:", err);
      throw err;
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      try {
        router.push("/");
      } catch {}
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Sign out error:", err);
      throw err;
    }
  }, [supabase, router]);

  const value = useMemo(() => ({ user, loading, loginWithGoogle, logout }), [user, loading, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * Optional HOC if you want to protect components with a built-in sign-in UI.
 * You can remove this export if you don't use it.
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function WithAuthWrapper(props: P) {
    const { user, loading, loginWithGoogle } = useAuth();
    const supabase = useMemo(() => createClientComponentClient(), []);
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Checking authentication…</p>
          </div>
        </div>
      );
    }

    if (user) return <Component {...props} />;

    const handleGoogle = async () => {
      setBusy(true);
      setMessage(null);
      try {
        await loginWithGoogle();
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error(err);
        setMessage("Google sign-in failed. Try again.");
      } finally {
        setBusy(false);
      }
    };

    const handleMagicLink = async (e?: React.FormEvent) => {
      e?.preventDefault();
      setBusy(true);
      setMessage(null);
      try {
        const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/admin`;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setMessage(`Magic link sent to ${email}. Check your inbox.`);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error(err);
        setMessage(err?.message ?? "Failed to send magic link.");
      } finally {
        setBusy(false);
      }
    };

    const handleSignUp = async (e?: React.FormEvent) => {
      e?.preventDefault();
      setBusy(true);
      setMessage(null);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Sign-up successful. Check your email for confirmation.");
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error(err);
        setMessage(err?.message ?? "Sign up failed.");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="p-3 bg-primary/10 rounded-lg inline-block mb-4">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Admin Sign in</h2>
            <p className="text-sm text-muted-foreground">Sign in with Google or email</p>
          </div>

          {message && <div className="mb-4 p-3 rounded-md bg-muted/20 text-sm">{message}</div>}

          <div className="mb-4">
            <button onClick={handleGoogle} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-muted">
              Sign in with Google
            </button>
          </div>

          <div className="my-2 flex items-center">
            <hr className="flex-1 border-border" />
            <span className="mx-3 text-xs text-muted-foreground">or</span>
            <hr className="flex-1 border-border" />
          </div>

          <div className="flex gap-2 mb-4">
            <button className={`flex-1 py-2 rounded-md ${mode === "signin" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => { setMode("signin"); setMessage(null); }}>
              Sign in with Email
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <label className="block text-sm font-medium">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border border-input rounded-md" />
              <button type="submit" disabled={busy} className="w-full py-2 rounded-md bg-primary text-primary-foreground">{busy ? "Sending..." : "Send magic link"}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <label className="block text-sm font-medium">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border border-input rounded-md" />
              <label className="block text-sm font-medium">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className="w-full px-3 py-2 border border-input rounded-md" />
              <button type="submit" disabled={busy} className="w-full py-2 rounded-md bg-primary text-primary-foreground">{busy ? "Creating..." : "Create account"}</button>
            </form>
          )}

          <div className="mt-4 text-xs text-muted-foreground">By signing up you agree to the project's terms. Use magic link to avoid remembering passwords.</div>
        </div>
      </div>
    );
  };
}
