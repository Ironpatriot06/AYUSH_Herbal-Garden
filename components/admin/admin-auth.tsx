// components/admin/admin-auth.tsx
'use client';

import React, { useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isStrongPassword(v: string) {
  return v.length >= 8;
}

export default function AdminAuth(): JSX.Element {
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [mode, setMode] = useState<"magic" | "signin" | "signup">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyMagic, setBusyMagic] = useState(false);
  const [busySignIn, setBusySignIn] = useState(false);
  const [busySignUp, setBusySignUp] = useState(false);
  const [busyResend, setBusyResend] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    setMessage(null);
    setBusyGoogle(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });
    } catch (e: any) {
      setMessage(e?.message || "Google sign-in failed");
    } finally {
      setBusyGoogle(false);
    }
  };

  const handleMagicLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidEmail(email)) return setMessage("Enter a valid email.");
    setMessage(null);
    setBusyMagic(true);
    try {
      const redirectTo = `${window.location.origin}/admin`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMessage(`Magic link sent to ${email}. Open it on this device.`);
    } catch (e: any) {
      setMessage(e?.message || "Failed to send magic link.");
    } finally {
      setBusyMagic(false);
    }
  };

  const handlePasswordSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidEmail(email)) return setMessage("Enter a valid email.");
    if (!password) return setMessage("Enter your password.");
    setMessage(null);
    setBusySignIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.href = "/admin";
    } catch (e: any) {
      setMessage(e?.message || "Sign in failed.");
    } finally {
      setBusySignIn(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidEmail(email)) return setMessage("Enter a valid email.");
    if (!isStrongPassword(password)) return setMessage("Password must be at least 8 characters.");
    setMessage(null);
    setBusySignUp(true);
    try {
      const redirectTo = `${window.location.origin}/auth/confirm`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMessage("Check your email to confirm, then come back and sign in.");
      setMode("signin");
    } catch (e: any) {
      setMessage(e?.message || "Sign up failed.");
    } finally {
      setBusySignUp(false);
    }
  };

  const handleResend = async () => {
    if (!isValidEmail(email)) return setMessage("Enter your email then click Resend.");
    setMessage(null);
    setBusyResend(true);
    try {
      const redirectTo = `${window.location.origin}/auth/confirm`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMessage(`Confirmation email resent to ${email}.`);
    } catch (e: any) {
      setMessage(e?.message || "Could not resend confirmation email.");
    } finally {
      setBusyResend(false);
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
          <p className="text-sm text-muted-foreground">Magic Link • Email & Password • Google</p>
        </div>

        {message && <div className="mb-4 p-3 rounded-md bg-muted/20 text-sm">{message}</div>}

        <div className="mb-4">
          <button
            onClick={loginWithGoogle}
            disabled={busyGoogle}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-muted"
          >
            {busyGoogle ? "Redirecting…" : "Continue with Google"}
          </button>
        </div>

        <div className="my-2 flex items-center">
          <hr className="flex-1 border-border" />
          <span className="mx-3 text-xs text-muted-foreground">or</span>
          <hr className="flex-1 border-border" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            className={`py-2 rounded-md ${mode === "magic" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setMode("magic")}
          >
            Magic Link
          </button>
          <button
            className={`py-2 rounded-md ${mode === "signin" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setMode("signin")}
          >
            Email & Password
          </button>
          <button
            className={`py-2 rounded-md ${mode === "signup" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setMode("signup")}
          >
            Create Account
          </button>
        </div>

        {mode === "magic" && (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <label className="block text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
            <button type="submit" disabled={busyMagic} className="w-full py-2 rounded-md bg-primary text-primary-foreground">
              {busyMagic ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}

        {mode === "signin" && (
          <form onSubmit={handlePasswordSignIn} className="space-y-3">
            <label className="block text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
            <button type="submit" disabled={busySignIn} className="w-full py-2 rounded-md bg-primary text-primary-foreground">
              {busySignIn ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <label className="block text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 8 chars)"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
            <button type="submit" disabled={busySignUp} className="w-full py-2 rounded-md bg-primary text-primary-foreground">
              {busySignUp ? "Creating..." : "Create account"}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={busyResend}
              className="w-full mt-2 py-2 rounded-md border hover:bg-muted"
            >
              {busyResend ? "Resending…" : "Resend confirmation email"}
            </button>
            <p className="text-xs text-muted-foreground">
              You’ll receive a confirmation link. After confirming, go to /admin and sign in.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
