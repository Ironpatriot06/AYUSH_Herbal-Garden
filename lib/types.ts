// Type definitions for the Ayush Plant Database
/* --- Types --- */

export interface Plant {
  id: number;
  common_name: string;
  scientific_name: string;
  sanskrit_name?: string | null;
  common_names: string[];
  family: string;
  description: string;
  parts_used: string[];
  medicinal_properties: string[];
  ailments: string[];
  dosage?: string | null;
  contraindications?: string | null;
  image_url?: string | null;
  created_at: string | null;
  updated_at: string | null;
  preparations?: Preparation[];
  references?: Reference[];
}

export interface Preparation {
  id: number;
  plant_id: number;
  name: string;
  method: string;
  notes?: string | null;
  created_at?: string | null;
}

export interface Reference {
  id: number;
  plant_id: number;
  title: string;
  authors?: string | null;
  journal?: string | null;
  year?: number | null;
  doi?: string | null;
  url?: string | null;
  created_at?: string | null;
}


export interface AdminUser {
  id: number
  email: string
  name: string
  role: string
  created_at: string
  last_login?: string
}

export interface SearchFilters {
  query?: string
  family?: string
  parts_used?: string[]
  medicinal_properties?: string[]
  ailments?: string[]
}

export interface PlantFormData {
  scientific_name: string
  sanskrit_name?: string
  common_name: string
  family: string
  description: string
  parts_used: string[]
  medicinal_properties: string[]
  ailments: string[]
  dosage?: string
  contraindications?: string
  image_url?: string
}
