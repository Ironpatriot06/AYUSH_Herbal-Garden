// components/admin/AddPlantModal.tsx
"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // if you have one or use <textarea>
import { PlantInsert } from "@/lib/plantsClient";

export default function AddPlantModal({ onAdded }: { onAdded?: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const [commonName, setCommonName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [family, setFamily] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const { addPlant } = (window as any).__usePlantsRef ?? {}; // fallback if not provided

  // Better: accept addPlant via props instead of global; for demo we'll call an async "add" passed in props/context.

  async function handleCreate() {
    setBusy(true);
    try {
      const payload: PlantInsert = {
        common_name: commonName,
        scientific_name: scientificName || null,
        family: family || null,
        description: description || null,
      };
      // If you import addPlant via props, call props.addPlant(payload)
      if (typeof (window as any).__addPlant === "function") {
        const created = await (window as any).__addPlant(payload);
        onAdded?.(created);
      } else {
        // fallback: call API route or tell developer to wire addPlant prop
        console.warn("addPlant function not wired — pass addPlant as prop to AddPlantModal.");
      }
      setOpen(false);
      setCommonName("");
      setScientificName("");
      setFamily("");
      setDescription("");
    } catch (err: any) {
      alert("Create failed: " + (err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Plant</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Add Plant</h3>
            <div className="space-y-3">
              <Input placeholder="Common name" value={commonName} onChange={(e) => setCommonName((e.target as HTMLInputElement).value)} />
              <Input placeholder="Scientific name" value={scientificName} onChange={(e) => setScientificName((e.target as HTMLInputElement).value)} />
              <Input placeholder="Family" value={family} onChange={(e) => setFamily((e.target as HTMLInputElement).value)} />
              <Textarea placeholder="Description" value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={busy || !commonName}>
                {busy ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
