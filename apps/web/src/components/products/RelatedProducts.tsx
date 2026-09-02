import type { ProductListItem } from "@/lib/api/products";
import { CircuitCard } from "@/components/circuits/CircuitCard";
import { ExcursionCard } from "@/components/excursions/ExcursionCard";
import { Squiggle } from "@/components/ui/Doodles";
import { Link } from "@/i18n/navigation";
import { IconArrowRight } from "@tabler/icons-react";

const MAX_DISPLAYED = 2;

type Props = {
  products: ProductListItem[];
  title: string;
  intro?: string;
  /** Lien "voir tout", affiché uniquement si fourni avec seeAllLabel. */
  seeAllHref?: string;
  seeAllLabel?: string;
};

export function RelatedProducts({ products, title, intro, seeAllHref, seeAllLabel }: Props) {
  if (products.length === 0) return null;

  // Curaté plutôt qu'exhaustif : deux suggestions gardent la section
  // lisible et bien équilibrée, même si beaucoup de produits sont liés.
  const displayed = products.slice(0, MAX_DISPLAYED);

  return (
    <section className="mt-16 border-t border-stone-200 bg-[#F6F1E9] py-14 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900 sm:text-3xl">
            {title}
          </h2>
          <Squiggle className="mx-auto mt-1 h-2 w-20 opacity-50" color="#F4A261" />
          {intro && (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
              {intro}
            </p>
          )}
        </div>

        <div className="mx-auto mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          {displayed.map((product) => (
            <div key={product.id} className="w-full sm:max-w-sm">
              {product.product_type === "circuit" ? (
                <CircuitCard circuit={product} />
              ) : (
                <ExcursionCard excursion={product} />
              )}
            </div>
          ))}
        </div>

        {seeAllHref && seeAllLabel && (
          <div className="mt-8 flex justify-center">
            <Link
              href={seeAllHref}
              className="group inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-[#1d4e5f] transition-colors hover:bg-stone-50"
            >
              {seeAllLabel}
              <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
