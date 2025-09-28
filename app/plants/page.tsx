// app/plants/page.tsx
import Link from "next/link";

export default function PlantsIndex() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-3">Plants</h1>
      <p className="text-muted-foreground mb-4">No list implemented yet.</p>
      <Link className="px-3 py-2 rounded-md bg-primary text-primary-foreground" href="/plants/new">
        + Add Plant
      </Link>
    </div>
  );
}
