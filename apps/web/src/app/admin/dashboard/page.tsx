// apps/web/src/app/admin/dashboard/page.tsx
"use client";

import { RequireAuth } from "../RequireAuth";
import { ProductList } from "@/components/admin/ProductList";

function DashboardContent() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">Produits</h1>
      <ProductList />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}