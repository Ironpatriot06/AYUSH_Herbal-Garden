"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// If you gate with auth, keep these; else remove:
import { AuthProvider, useAuth } from "@/lib/auth";

function AddPlantInner() {
  // Remove these two lines if you don't want auth gating:
  const { user, loading } = useAuth();
  console.log("Logged in user:", user);

  const signedOut = !loading && !user;

  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();

  const [commonName, setCommonName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [family, setFamily] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [medicinalProps, setMedicinalProps] = useState("");
  const [ailments, setAilments] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [dosage, setDosage] = useState("");
  const [contraindications, setContraindications] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("session?", session ? "YES" : "NO", "role:", session?.user?.role, "uid:", session?.user?.id);
    })();
  }, [supabase]);
  

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (signedOut) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">Sign in required</h1>
        <p className="text-sm text-muted-foreground">
          Please <a className="text-primary underline" href="/admin/auth">sign in</a> to add plants.
        </p>
      </div>
    );
  }

  const toArrayOrNull = (s: string) => {
    const arr = s.split(",").map(x => x.trim()).filter(Boolean);
    return arr.length ? arr : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMsg(null);
    setBusy(true);
  
    try {
      // 1) HTML validation first (scientific name required)
      if (!scientificName.trim()) {
        setMsg("Scientific name is required.");
        alert("Scientific name is required."); // loud
        return;
      }
  
      console.log("[create] clicked");
  
      const toArrayOrNull = (s: string) => {
        const a = s.split(",").map(x => x.trim()).filter(Boolean);
        return a.length ? a : null;
      };
  
      const payload = {
        common_name: commonName.trim() || null,
        scientific_name: scientificName.trim(),
        family: family.trim() || null,
        description: description.trim() || null,
        parts_used: toArrayOrNull(partsUsed),
        medicinal_properties: toArrayOrNull(medicinalProps),
        ailments: toArrayOrNull(ailments),
        dosage: dosage.trim() || null,
        contraindications: contraindications.trim() || null,
        metadata: imageUrl.trim() ? { image_url: imageUrl.trim() } : null,
        // created_by: user?.id ?? null, // uncomment if your RLS requires it
      };
  
      console.log("[create] payload =", payload);
  
      const { data, error } = await supabase
        .from("plants")
        .insert(payload)
        .select("id") // needs SELECT permission by your policies
        .single();    // use single() so it throws if multiple/none
  
      console.log("[create] supabase response =", { data, error });
  
      if (error) {
        console.error("[create] supabase error:", error);
        const message = error.message || "Failed to create plant.";
        setMsg(message);
        alert(`Supabase error: ${message}`);
        return;
      }
  
      const newId = (data as any)?.id;
      console.log("[create] newId =", newId);
  
      if (Number.isInteger(newId) && newId > 0) {
        setMsg(`Created with id ${newId}. Redirecting…`);
        router.push(`/plants/${newId}`);
      } else {
        // If RLS blocked the select-after-insert, data may be undefined/null
        setMsg("Plant created but no ID returned (RLS?). Going to /plants …");
        alert("Created, but no ID returned. Taking you to /plants.");
        router.push("/plants");
      }
    } catch (err: any) {
      console.error("[create] unexpected error:", err);
      const message = err?.message || "Unexpected error during create.";
      setMsg(message);
      alert(message);
    } finally {
      setBusy(false);
    }
  }
  
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Add Plant</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Comma-separate list fields (care requirements, properties, ailments).
      </p>

      {msg && <div className="mb-4 p-3 rounded-md bg-muted/30 text-sm">{msg}</div>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium">Common name</label>
          <input
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Tulsi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Scientific name</label>
          <input
            value={scientificName}
            onChange={(e) => setScientificName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Ocimum sanctum"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Family</label>
          <input
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Lamiaceae"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={4}
            placeholder="Short description of the plant…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Care Requirements (comma-separated)</label>
          <input
            value={partsUsed}
            onChange={(e) => setPartsUsed(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Leaves, Seeds, Root"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Medicinal properties (comma-separated)</label>
          <input
            value={medicinalProps}
            onChange={(e) => setMedicinalProps(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Antipyretic, Anti-inflammatory, Expectorant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Ailments (comma-separated)</label>
          <input
            value={ailments}
            onChange={(e) => setAilments(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Common cold, Cough, Headache"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Dosage (optional)</label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., 2–3 leaves daily"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Contraindications (optional)</label>
            <input
              value={contraindications}
              onChange={(e) => setContraindications(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Avoid in pregnancy"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Image URL (optional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="https://…"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            {busy ? "Saving…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => history.back()}
            className="px-4 py-2 rounded-md border"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Page() {
  // If you removed auth, just `return <AddPlantInner />`
  return (
    <AuthProvider>
      <AddPlantInner />
    </AuthProvider>
  );
}
