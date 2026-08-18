// apps/web/src/components/admin/ProductList.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/admin/AuthContext";
import { listAdminProducts, AdminApiError } from "@/lib/api/admin-products";
import Link from "next/link";
import type { ProductAdminListItem } from "@/types/api";

export function ProductList() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ProductAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listAdminProducts(accessToken, { limit: 50, offset: 0 })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof AdminApiError ? err.message : "Erreur inattendue";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (isLoading) return <p className="text-stone-500">Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;
  if (items.length === 0) return <p className="text-stone-500">Aucun produit.</p>;

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">{total} produit(s)</p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-stone-500">
            <th className="py-2">Titre</th>
            <th className="py-2">Type</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Publié</th>
            <th className="py-2">Prix</th>
          </tr>
        </thead>
        <tbody>
        {items.map((item) => (
            <tr
            key={item.id}
            className="cursor-pointer border-b border-stone-100 hover:bg-stone-50"
            >
            <td className="py-2">
                <Link href={`/admin/products/${item.id}`} className="block">
                {item.title}
                </Link>
            </td>
            <td className="py-2">{item.product_type}</td>
            <td className="py-2">{item.status}</td>
            <td className="py-2">{item.is_published ? "Oui" : "Non"}</td>
            <td className="py-2">
                {item.price_from} {item.currency}
            </td>
            </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}