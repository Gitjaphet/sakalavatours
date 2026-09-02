import type { ProductListItem } from "@/lib/api/products";
import { CircuitCard } from "@/components/circuits/CircuitCard";
import { ExcursionCard } from "@/components/excursions/ExcursionCard";
import { Squiggle } from "@/components/ui/Doodles";

type Props = {
  products: ProductListItem[];
  title: string;
  intro?: string;
};

export function RelatedProducts({ products, title, intro }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-stone-200 bg-[#F6F1E9] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900 sm:text-3xl">
            {title}
          </h2>
          <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
          {intro && (
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{intro}</p>
          )}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) =>
            product.product_type === "circuit" ? (
              <CircuitCard key={product.id} circuit={product} />
            ) : (
              <ExcursionCard key={product.id} excursion={product} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
