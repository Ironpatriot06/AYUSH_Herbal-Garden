// lib/plantsClient.ts
import { getBrowserSupabase } from "./supabaseClient";

export type PlantInsert = {
  common_name: string;
  scientific_name?: string | null;
  sanskrit_name?: string | null;
  family?: string | null;
  description?: string | null;
  parts_used?: string[] | null;
  medicinal_properties?: string[] | null;
  ailments?: string[] | null;
  uses?: string[] | null;
  dosage?: string | null;
  contraindications?: string | null;
  // metadata or image_url optional
  image_url?: string | null;
};

export async function fetchPlants(limit = 1000) {
  const supabase = getBrowserSupabase();
  const res = await supabase
    .from("plants")
    .select(
      "id, common_name, scientific_name, sanskrit_name, common_names, common_names_text, family, description, parts_used, medicinal_properties, ailments, uses, dosage, contraindications, metadata, image_url, created_at, updated_at"
    )
    .limit(limit);
  return res;
}

export async function insertPlant(payload: PlantInsert) {
  const supabase = getBrowserSupabase();
  return supabase.from("plants").insert(payload).select().single();
}

export async function deletePlant(id: number) {
  const supabase = getBrowserSupabase();
  return supabase.from("plants").delete().eq("id", id);
}
