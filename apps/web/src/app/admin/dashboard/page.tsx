// apps/web/src/app/admin/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { RequireAuth } from "../RequireAuth";
import { useAuth } from "../AuthContext";
import { ProductList } from "@/components/admin/ProductList";

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/admin/login");
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <p className="text-sm text-stone-600">
          Connecté en tant que <span className="font-medium">{user?.full_name}</span>
        </p>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          Se déconnecter
        </button>
      </header>
      <main className="p-6">
        <h1 className="mb-4 text-xl font-semibold">Produits</h1>
        <ProductList />
      </main>
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