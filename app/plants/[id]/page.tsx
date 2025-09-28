// components/PlantDetailPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { redirect } from "next/navigation"
// app/plants/[id]/page.tsx

import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Beaker,
  AlertTriangle,
  Leaf,
  Info,
  Clock,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import Link from "next/link";
// app/plants/[id]/page.tsx


import { getBrowserSupabase } from "@/lib/supabaseClient"; // <-- ensure this exists and returns a supabase client
import type { Reference,Plant,Preparation } from "@/lib/types";
/**
 * Normalizes DB text[] or string fields to string[]
 */
function ensureStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string") {
    const trimmed = v.trim();
    // Postgres text[] sometimes arrives as "{a,b}"
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const inner = trimmed.slice(1, -1);
      if (!inner) return [];
      // split on comma but preserve values that may contain commas in quotes? simple split ok here
      return inner.split(",").map((s) => s.trim()).filter(Boolean);
    }
    // fallback: comma-separated
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  // fallback single val
  return [String(v)];
}


export default function PlantDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFromDb() {
      setLoading(true);
      setErrorMsg(null);

      const idParam = params?.id;
      const plantId = Number(idParam);
      if (!idParam || Number.isNaN(plantId)) {
        setErrorMsg("Invalid plant ID.");
        setLoading(false);
        return;
      }

      try {
        const supabase = getBrowserSupabase();

        // fetch plant
        const { data: plantData, error: plantError } = await supabase
          .from("plants")
          .select(
            `id,
             common_name,
             scientific_name,
             sanskrit_name,
             common_names,
             common_names_text,
             family,
             description,
             parts_used,
             medicinal_properties,
             ailments,
             uses,
             dosage,
             contraindications,
             metadata,
             created_at,
             updated_at`
          )
          .eq("id", plantId)
          .maybeSingle();

        if (plantError) {
          // permission or other DB error
          console.error("Error fetching plant:", plantError);
          setErrorMsg(plantError.message ?? "Failed to fetch plant.");
          setLoading(false);
          return;
        }

        if (!plantData) {
          setPlant(null);
          setErrorMsg("Plant not found.");
          setLoading(false);
          return;
        }

        // fetch single image for plant (images table expected)
        let imageUrl: string | null = null;
        try {
          const { data: imgData, error: imgError } = await supabase
            .from("images")
            .select("id, plant_id, storage_path")
            .eq("plant_id", plantId)
            .limit(1)
            .maybeSingle();
          if (imgError) {
            // non-fatal: just warn
            console.warn("Image fetch error:", imgError);
          } else if (imgData) {
            imageUrl = imgData.storage_path ?? imgData.storage_path ?? null;
            // If you're using Supabase Storage and stored storage_path, convert to public URL here
            // e.g. imageUrl = imgData.storage_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/your-bucket/${imgData.storage_path}` : imageUrl
          }
        } catch (e) {
          console.warn("Images query threw:", e);
        }

        // fetch preparations
        let fetchedPreparations: Preparation[] = [];
try {
  const { data: prepData, error: prepError } = await supabase
    .from("preparations")
    .select("*")
    .eq("plant_id", plantId)
    .order("id", { ascending: true });

  if (prepError) {
    console.warn("Preparations fetch error:", prepError);
  } else if (Array.isArray(prepData)) {
    fetchedPreparations = prepData.map((p) => ({
      id: p.id,
      plant_id: p.plant_id,
      name: p.name,
      method: p.method,
      notes: p.notes ?? null,
      created_at: p.created_at,
    }));
  }
} catch (e) {
  console.warn("Preparations query threw:", e);
}


        // fetch references
        let fetchedReferences: Reference[] = [];
        try {
          const { data: refData, error: refError } = await supabase
            .from("references")
            .select("*")
            .eq("plant_id", plantId)
            .order("id", { ascending: true });
          if (refError) {
            console.warn("References fetch error:", refError);
          } else if (Array.isArray(refData)) {
            fetchedReferences = (refData as any[]).map((r) => ({
              id: r.id,
              plant_id: r.plant_id,
              title: r.title,
              authors: r.authors ?? null,
              journal: r.journal ?? null,
              year: r.year ?? null,
              doi: r.doi ?? null,
              url: r.url ?? null,
              created_at: r.created_at,
            }));
          }
        } catch (e) {
          console.warn("References query threw:", e);
        }

        if (!mounted) return;

        // build normalized plant object
        const normalizedPlant: Plant = {
          id: plantData.id,
          common_name: plantData.common_name ?? "",
          scientific_name: plantData.scientific_name ?? "",
          sanskrit_name: plantData.sanskrit_name ?? undefined,
          common_names: Array.isArray(plantData.common_names)
            ? plantData.common_names
            : ensureStringArray(plantData.common_names ?? plantData.common_names_text),
          family: plantData.family ?? "",
          description: plantData.description ?? "",
          parts_used: ensureStringArray(plantData.parts_used),
          medicinal_properties: ensureStringArray(plantData.medicinal_properties),
          ailments: ensureStringArray(plantData.ailments),
          dosage: plantData.dosage ?? null,
          contraindications: plantData.contraindications ?? null,
          image_url: imageUrl ?? (plantData.metadata?.image ?? plantData.metadata?.image_url ?? null),
          created_at: plantData.created_at ?? "",
          updated_at: plantData.updated_at ?? "",
          preparations: fetchedPreparations,
          references: fetchedReferences,
        };

        setPlant(normalizedPlant);
        setPreparations(fetchedPreparations);
        setReferences(fetchedReferences);
      } catch (err: any) {
        console.error("Unexpected error loading plant:", err);
        setErrorMsg("Unexpected error loading plant.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // run
    loadFromDb();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  // Loading UI
  if (loading) {
    return <PlantDetailSkeleton />;
  }

  // Error or not found
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button onClick={() => location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Plant Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested plant could not be found in our database.</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  const partsUsed = plant.parts_used ?? [];
  const properties = plant.medicinal_properties ?? [];
  const ailments = plant.ailments ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"> */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Catalog
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {/* <Leaf className="h-5 w-5 text-primary" /> */}
              </div>
              {/* <div>
                <h1 className="font-semibold">Ayush Plant Database</h1>
                <p className="text-xs text-muted-foreground">Plant Details</p>
              </div> */}
            </div>
          </div>
        </div>
      {/* </header> */}

      <div className="container mx-auto px-4 py-8">
        {/* Plant Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <div className="aspect-square relative overflow-hidden rounded-xl bg-muted">
              <Image
                src={String(plant.image_url ?? "/placeholder.svg?height=400&width=400")}
                alt={plant.common_name ?? "Plant image"}
                fill
                className="object-cover"
                // If external images are used, configure next.config.js images.domains or use loader.
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {plant.family}
                </Badge>
                <h1 className="text-3xl font-bold text-balance">{plant.common_name}</h1>
                <p className="text-xl text-muted-foreground italic">{plant.scientific_name}</p>
                {/* {plant.sanskrit_name && <p className="text-lg text-accent font-medium">{plant.sanskrit_name}</p>} */}
              </div>

              {/* <p className="text-muted-foreground leading-relaxed">{plant.description}</p> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    Care Requirements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {partsUsed.length > 0 ? (
                      partsUsed.map((part) => (
                        <Badge key={part} variant="outline">
                          {part}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Not specified</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-primary" />
                    Key Properties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {properties.length > 0 ? (
                      properties.slice(0, 4).map((property) => (
                        <Badge key={property} variant="secondary">
                          {property}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Not specified</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preparations">Preparations</TabsTrigger>
            <TabsTrigger value="usage">Usage & Dosage</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-primary" />
                    Medicinal Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {properties.length > 0 ? (
                      properties.map((property) => (
                        <Badge key={property} variant="secondary" className="justify-center">
                          {property}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No properties listed.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Therapeutic Uses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ailments.length > 0 ? (
                      ailments.map((ailment) => (
                        <div key={ailment} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm">{ailment}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No therapeutic uses listed.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {plant.contraindications && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Contraindications & Precautions:</strong> {plant.contraindications}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="preparations" className="space-y-6">
  {preparations.length > 0 ? (
    <div className="space-y-8">   {/* <-- was a grid; now full-width rows */}
      {preparations.map((preparation) => (
        <PreparationCard key={preparation.id} preparation={preparation} />
      ))}
    </div>
  ) : (
    <Card>
      <CardContent className="text-center py-8">
        <Beaker className="h-11 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Preparations Available</h3>
        <p className="text-muted-foreground">
          Detailed preparation methods for this plant are not yet available in the database.
        </p>
      </CardContent>
    </Card>
  )}
</TabsContent>


          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Dosage Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plant.dosage ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium text-sm">Recommended Dosage</p>
                        <p className="text-sm text-muted-foreground mt-1">{plant.dosage}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Always consult with a qualified Ayurvedic practitioner before use.
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Doctor to be consulted for dosage requirements.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Usage Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm mb-1">Best Time to Take</p>
                      <p className="text-sm text-muted-foreground">As directed by practitioner</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">Duration</p>
                      <p className="text-sm text-muted-foreground">Varies based on condition</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">Administration</p>
                      <p className="text-sm text-muted-foreground">With warm water or as prescribed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {plant.contraindications && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> {plant.contraindications}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="references" className="space-y-6">
            {references.length > 0 ? (
              <div className="space-y-4">
                {references.map((reference) => (
                  <ReferenceCard key={reference.id} reference={reference} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No References Available</h3>
                  <p className="text-muted-foreground">
                    Scientific references for this plant are not yet available in the database.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* --- small subcomponents --- */

function PreparationCard({ preparation }: { preparation: Preparation }) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Method */}
      <Card className="h-full rounded-2xl border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Beaker className="h-5 w-5 text-primary" />
            Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Shorter box; scroll only if needed */}
          <div className="max-h-56 overflow-y-auto">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {preparation.method}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {preparation.notes && (
        <Card className="h-full rounded-2xl border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {preparation.notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





function ReferenceCard({ reference }: { reference: Reference }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <h3 className="font-semibold leading-tight">{reference.title}</h3>

          {reference.authors && <p className="text-sm text-muted-foreground">{reference.authors}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {reference.journal && <span>{reference.journal}</span>}
            {reference.year && <span>{reference.year}</span>}
            {reference.doi && (
              <Badge variant="outline" className="text-xs">
                DOI: {reference.doi}
              </Badge>
            )}
          </div>

          {reference.url && (
            <div>
              <Link href={reference.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink className="h-3 w-3" />
                View Publication
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* --- Skeleton --- */

function PlantDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-8 bg-muted rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-1">
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                <div className="w-20 h-3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="aspect-square bg-muted rounded-xl animate-pulse" />
          <div className="lg:col-span-2 space-y-4">
            <div className="w-20 h-6 bg-muted rounded animate-pulse" />
            <div className="w-3/4 h-8 bg-muted rounded animate-pulse" />
            <div className="w-1/2 h-6 bg-muted rounded animate-pulse" />
            <div className="w-full h-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}