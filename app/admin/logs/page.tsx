// app/admin/logs/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { AuthProvider, useAuth } from "@/lib/auth";

type LogRow = {
  id: number | string;
  user_id: string | null;
  question: string | null;
  answer: string | null;
  created_at: string | null;
  meta?: any;
};

function LogsInner() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const { user, loading } = useAuth();

  const [rows, setRows] = useState<LogRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // gate (adjust the email if you want)
  const ADMIN_EMAIL = "ratishkapoor5@gmail.com";

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth"); // not signed in
    else if (user.email !== ADMIN_EMAIL) router.replace("/"); // not admin
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setBusy(true);
      setMsg(null);
      try {
        // CHANGE THE TABLE NAME IF YOURS IS DIFFERENT:
        // 'logs' is a sane default. Try 'chat_logs' if you used that name.
        const { data, error } = await supabase
          .from("logs")
          .select("id, user_id, question, answer, created_at, meta")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) throw error;
        setRows((data || []) as any);
      } catch (err: any) {
        // Helpful hint if table doesn't exist yet
        if (err?.code === "42P01") {
          setMsg(
            "Logs table not found. Create it with the SQL in the note below (see page)."
          );
        } else {
          setMsg(err?.message || "Failed to load logs.");
        }
      } finally {
        setBusy(false);
      }
    })();
  }, [supabase, user]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chat Logs</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Back to Admin
        </Link>
      </div>

      {msg && (
        <div className="p-3 rounded-md bg-amber-50 text-amber-900 text-sm">
          {msg}
          <details className="mt-2">
            <summary className="cursor-pointer">Show example SQL to create the table</summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap">
{`create table if not exists public.logs (
  id bigserial primary key,
  user_id uuid,
  question text,
  answer text,
  meta jsonb,
  created_at timestamptz default now()
);

-- RLS (read for admin only, insert from app)
alter table public.logs enable row level security;

-- Admin read (by email in JWT)
create policy logs_select_admin on public.logs
for select to authenticated
using (auth.jwt()->>'email' = '${ADMIN_EMAIL}');

-- Anyone authed can insert (if you log from the app)
create policy logs_insert_authed on public.logs
for insert to authenticated
with check (true);`}
            </pre>
          </details>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Time</th>
              <th className="p-3">User</th>
              <th className="p-3">Question</th>
              <th className="p-3">Answer</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={4}>
                  {busy ? "Loading…" : "No logs yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={String(r.id)} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">{r.user_id ?? "—"}</td>
                  <td className="p-3 max-w-[28rem]">
                    <div className="line-clamp-3 whitespace-pre-wrap">{r.question ?? "—"}</div>
                  </td>
                  <td className="p-3 max-w-[28rem]">
                    <div className="line-clamp-4 whitespace-pre-wrap">{r.answer ?? "—"}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <LogsInner />
    </AuthProvider>
  );
}
