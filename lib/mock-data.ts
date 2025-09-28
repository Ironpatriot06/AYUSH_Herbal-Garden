// Mock data for development (until database is connected)
import type { Plant, Preparation, Reference } from "./types"

export const mockPlants: Plant[] = [
  {
    id: 1,
    scientific_name: "Withania somnifera",
    sanskrit_name: "Ashwagandha",
    common_name: "Winter Cherry",
    family: "Solanaceae",
    description:
      "Ashwagandha is one of the most important herbs in Ayurveda, known as an adaptogen that helps the body manage stress. It has been used for over 3,000 years to relieve stress, increase energy levels, and improve concentration.",
    parts_used: ["Root", "Leaves"],
    medicinal_properties: ["Adaptogenic", "Anti-inflammatory", "Immunomodulatory", "Neuroprotective"],
    ailments: ["Stress", "Anxiety", "Insomnia", "Fatigue", "Arthritis"],
    dosage: "300-500mg twice daily",
    contraindications: "Avoid during pregnancy and breastfeeding. May interact with immunosuppressant medications.",
    image_url: "/ashwagandha-plant-with-roots.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    scientific_name: "Curcuma longa",
    sanskrit_name: "Haridra",
    common_name: "Turmeric",
    family: "Zingiberaceae",
    description:
      "Turmeric is a golden spice that has been used in Ayurveda for thousands of years. It contains curcumin, a powerful anti-inflammatory compound that supports joint health and overall wellness.",
    parts_used: ["Rhizome"],
    medicinal_properties: ["Anti-inflammatory", "Antioxidant", "Hepatoprotective", "Antimicrobial"],
    ailments: ["Inflammation", "Arthritis", "Digestive issues", "Skin conditions"],
    dosage: "500-1000mg daily with black pepper",
    contraindications: "May increase bleeding risk. Avoid with gallstones.",
    image_url: "/turmeric-rhizome-and-powder.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    scientific_name: "Ocimum tenuiflorum",
    sanskrit_name: "Tulsi",
    common_name: "Holy Basil",
    family: "Lamiaceae",
    description:
      'Tulsi is considered sacred in Hindu tradition and is revered as the "Queen of Herbs" in Ayurveda. It is an adaptogenic herb that supports respiratory health and helps the body cope with stress.',
    parts_used: ["Leaves", "Seeds"],
    medicinal_properties: ["Adaptogenic", "Antimicrobial", "Expectorant", "Immunomodulatory"],
    ailments: ["Respiratory infections", "Stress", "Diabetes", "Fever"],
    dosage: "300-600mg twice daily or as tea",
    contraindications: "Generally safe. May lower blood sugar levels.",
    image_url: "/holy-basil-tulsi-plant-with-leaves.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    scientific_name: "Bacopa monnieri",
    sanskrit_name: "Brahmi",
    common_name: "Water Hyssop",
    family: "Plantaginaceae",
    description:
      "Brahmi is a renowned brain tonic in Ayurveda, traditionally used to enhance memory, learning, and cognitive function. It is considered one of the most important herbs for mental clarity and focus.",
    parts_used: ["Whole plant", "Leaves"],
    medicinal_properties: ["Nootropic", "Neuroprotective", "Anxiolytic", "Antioxidant"],
    ailments: ["Memory loss", "Anxiety", "ADHD", "Epilepsy"],
    dosage: "300-600mg daily",
    contraindications: "May cause drowsiness. Start with lower doses.",
    image_url: "/brahmi-bacopa-monnieri-aquatic-plant.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    scientific_name: "Terminalia chebula",
    sanskrit_name: "Haritaki",
    common_name: "Black Myrobalan",
    family: "Combretaceae",
    description:
      'Haritaki is called the "King of Medicines" in Ayurveda and is one of the three fruits in Triphala. It is highly valued for its digestive and detoxifying properties.',
    parts_used: ["Fruit"],
    medicinal_properties: ["Digestive", "Laxative", "Antioxidant", "Hepatoprotective"],
    ailments: ["Constipation", "Digestive disorders", "Respiratory issues", "Eye problems"],
    dosage: "1-3g daily with warm water",
    contraindications: "Avoid during pregnancy. May cause loose stools in high doses.",
    image_url: "/haritaki-terminalia-chebula-fruit-tree.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

export const mockPreparations: Preparation[] = [
  {
    id: 1,
    plant_id: 1,
    name: "Ashwagandha Powder",
    type: "Churna",
    ingredients: ["Dried Ashwagandha root - 100g"],
    steps: [
      "Clean and dry the roots completely",
      "Grind into fine powder using a spice grinder",
      "Sieve to remove any coarse particles",
      "Store in airtight container",
    ],
    dosage: "1/2 teaspoon twice daily",
    duration: "2-3 months",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    plant_id: 2,
    name: "Turmeric Milk",
    type: "Kshira Paka",
    ingredients: ["Turmeric powder - 1 tsp", "Milk - 1 cup", "Black pepper - pinch", "Honey - 1 tsp"],
    steps: [
      "Heat milk in a pan",
      "Add turmeric powder and black pepper",
      "Simmer for 5 minutes",
      "Add honey after cooling slightly",
    ],
    dosage: "1 cup before bedtime",
    duration: "1 month",
    created_at: "2024-01-01T00:00:00Z",
  },
]

export const mockReferences: Reference[] = [
  {
    id: 1,
    plant_id: 1,
    title: "An Overview on Ashwagandha: A Rasayana (Rejuvenator) of Ayurveda",
    authors: "Singh N, Bhalla M, de Jager P, Gilca M",
    journal: "African Journal of Traditional, Complementary and Alternative Medicines",
    year: 2011,
    doi: "10.4314/ajtcam.v8i5S.9",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3252722/",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    plant_id: 2,
    title: "Curcumin: A Review of Its Effects on Human Health",
    authors: "Hewlings SJ, Kalman DS",
    journal: "Foods",
    year: 2017,
    doi: "10.3390/foods6100092",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5664031/",
    created_at: "2024-01-01T00:00:00Z",
  },
]

// Helper functions for filtering and searching
export function filterPlants(
  plants: Plant[],
  filters: { query?: string; family?: string; parts_used?: string; medicinal_properties?: string; ailments?: string },
) {
  return plants.filter((plant) => {
    if (filters.query) {
      const query = filters.query.toLowerCase()
      const searchText =
        `${plant.scientific_name} ${plant.sanskrit_name} ${plant.common_name} ${plant.description}`.toLowerCase()
      if (!searchText.includes(query)) return false
    }

    if (filters.family && plant.family !== filters.family) return false
    if (filters.parts_used && !plant.parts_used.includes(filters.parts_used)) return false
    if (filters.medicinal_properties && !plant.medicinal_properties.includes(filters.medicinal_properties)) return false
    if (filters.ailments && !plant.ailments.includes(filters.ailments)) return false

    return true
  })
}

export function getUniqueValues(plants: Plant[], field: keyof Plant): string[] {
  const values = new Set<string>()
  plants.forEach((plant) => {
    const value = plant[field]
    if (Array.isArray(value)) {
      value.forEach((v) => values.add(v))
    } else if (typeof value === "string") {
      values.add(value)
    }
  })
  return Array.from(values).sort()
}
