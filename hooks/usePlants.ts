// hooks/usePlants.ts
"use client";
import { useEffect, useState } from "react";
import { fetchPlants, insertPlant, deletePlant } from "@/lib/plantsClient";

export default function usePlants() {
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetchPlants(1000);
      if (!mounted) return;
      if (res.error) {
        console.error("fetchPlants error", res.error);
        setErrorMsg(res.error.message ?? "Failed to fetch");
        setPlants([]);
      } else {
        setPlants(res.data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function addPlant(payload: any) {
    const res = await insertPlant(payload);
    if (res.error) throw res.error;
    const newRow = res.data;
    setPlants((p) => [newRow, ...p]);
    return newRow;
  }

  async function removePlant(id: number) {
    const res = await deletePlant(id);
    if (res.error) throw res.error;
    setPlants((p) => p.filter((pl) => pl.id !== id));
    return res;
  }

  return { plants, loading, errorMsg, addPlant, removePlant, setPlants };
}
