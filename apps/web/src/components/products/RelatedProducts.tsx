import type { ProductListItem } from "@/lib/api/products";
import { CircuitCard } from "@/components/circuits/CircuitCard";
import { ExcursionCard } from "@/components/excursions/ExcursionCard";
import { useTranslations } from "next-intl";

type Props = {
  products: ProductListItem[];
};

export function RelatedProducts({ products }: Props) {
  const t = useTranslations();

  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900">
        {t("detail.relatedTitle")}
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) =>
          product.product_type === "circuit" ? (
            <CircuitCard key={product.id} circuit={product} />
          ) : (
            <ExcursionCard key={product.id} excursion={product} />
          ),
        )}
      </div>
    </section>
  );
}