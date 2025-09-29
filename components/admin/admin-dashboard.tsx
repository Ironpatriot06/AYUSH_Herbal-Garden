// components/admin/admin-dashboard.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PlantLite = {
  id: number;
  common_name: string | null;
  scientific_name: string | null;
  updated_at: string | null;
};

export default function AdminDashboard(): JSX.Element | null {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const { user, loading, logout } = useAuth();

  // UI state
  const [busy, setBusy] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Stats
  const [plantsCount, setPlantsCount] = useState<number | null>(null);
  const [prepsCount, setPrepsCount] = useState<number | null>(null);
  const [refsCount, setRefsCount] = useState<number | null>(null);
  const [imagesCount, setImagesCount] = useState<number | null>(null);

  // Recent plants
  const [recentPlants, setRecentPlants] = useState<PlantLite[]>([]);

  // Gate: redirect if not signed in (when loading is done)
  useEffect(() => {
    if (loading) return;
    if (!user) {
      // send to your auth page
      router.replace("/auth");
    }
  }, [loading, user, router]);

  // Load profile + dashboard data when signed in
  useEffect(() => {
    if (!user || loading) return;

    // Avatar
    // @ts-ignore
    const maybePic = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || null;
    setAvatarSrc(maybePic);

    // Load counts + recent
    (async () => {
      try {
        const [p, pr, r, im] = await Promise.all([
          supabase.from("plants").select("*", { count: "exact", head: true }),
          supabase.from("preparations").select("*", { count: "exact", head: true }),
          supabase.from("references").select("*", { count: "exact", head: true }),
          supabase.from("images").select("*", { count: "exact", head: true }),
        ]);

        setPlantsCount(p.count ?? 0);
        setPrepsCount(pr.count ?? 0);
        setRefsCount(r.count ?? 0);
        setImagesCount(im.count ?? 0);

        const { data: latest, error } = await supabase
          .from("plants")
          .select("id, common_name, scientific_name, updated_at")
          .order("updated_at", { ascending: false })
          .limit(8);

        if (!error && Array.isArray(latest)) {
          setRecentPlants(latest as PlantLite[]);
        }
      } catch (e) {
        setMessage("Could not load dashboard data. Check Supabase keys/RLS.");
      }
    })();
  }, [user, loading, supabase]);

  // Loading guard
  if (loading || (!user && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin…</p>
        </div>
      </div>
    );
  }

  // SSR safety
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold">Ayush Plant Admin</h1>
              <p className="text-xs text-muted-foreground">Overview & quick actions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {avatarSrc ? (
              <img src={avatarSrc} className="h-8 w-8 rounded-full object-cover" alt="avatar" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted" />
            )}
            <div className="text-sm">
              <div className="font-medium">{(user as any)?.email}</div>
            </div>
            <button
              onClick={async () => {
                setBusy(true);
                try {
                  await logout();
                } finally {
                  setBusy(false);
                }
              }}
              className="ml-2 px-3 py-1 rounded-md border hover:bg-muted text-sm"
            >
              {busy ? "…" : "Sign out"}
            </button>
          </div>
        </div>
      </header> */}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {message && (
          <div className="p-3 rounded-md bg-amber-50 text-amber-800 text-sm">{message}</div>
        )}

        {/* Stats */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Plants" value={1000} />
            {/* <StatCard label="Preparations" value={prepsCount} />
            <StatCard label="References" value={refsCount} />
            <StatCard label="Images" value={imagesCount} /> */}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard title="Add Plant" desc="Create a new plant entry" href="/plants/new" icon="🌿" />
            {/* <ActionCard title="Import CSV" desc="Bulk import plants" href="/admin/import" icon="📥" /> */}
            {/* <ActionCard title="Vector Store" desc="(Re)build embeddings" href="/admin/rag" icon="🧠" /> */}
            {/* <ActionCard title="Chat Logs" desc="Inspect Q&A logs" href="/admin/logs" icon="💬" /> */}
          </div>
        </section>

        {/* Recent Activity */}
        {/* <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent plants</h2>
            <Link href="/admin/plants" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPlants.length === 0 ? (
              <div className="text-sm text-muted-foreground border rounded-md p-4">
                No recent items.
              </div>
            ) : (
              recentPlants.map((p) => (
                <div key={p.id} className="border rounded-lg p-4 bg-card hover:bg-accent/10 transition">
                  <div className="text-sm text-muted-foreground">
                    #{p.id} • {p.updated_at ? new Date(p.updated_at).toLocaleString() : "—"}
                  </div>
                  <div className="font-medium mt-1">
                    {p.common_name || "(no common name)"}{" "}
                    <span className="text-muted-foreground">
                      {p.scientific_name ? `— ${p.scientific_name}` : ""}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link href={`/plants/${p.id}`} className="text-primary text-sm hover:underline">
                      Open →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section> */}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? "—"}</div>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon?: string;
}) {
  return (
    <Link href={href} className="block border rounded-lg p-4 bg-card hover:bg-accent/10 transition">
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon ?? "⚙️"}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
      </div>
    </Link>
  );
}
