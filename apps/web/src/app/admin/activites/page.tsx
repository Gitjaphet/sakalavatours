// apps/web/src/app/admin/activites/page.tsx
"use client";

import { RequireAuth } from "../RequireAuth";
import { ProductList } from "@/components/admin/ProductList";

function ActivitesContent() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Activités</h1>
        <p className="mt-1 text-sm text-stone-500">
          Excursions et circuits proposés aux voyageurs.
        </p>
      </div>
      <ProductList />
    </div>
  );
}

export default function AdminActivitesPage() {
  return (
    <RequireAuth>
      <ActivitesContent />
    </RequireAuth>
  );
}
