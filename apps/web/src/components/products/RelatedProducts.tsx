import type { ProductListItem } from "@/lib/api/products";
import { CircuitCard } from "@/components/circuits/CircuitCard";
import { ExcursionCard } from "@/components/excursions/ExcursionCard";
import { Squiggle } from "@/components/ui/Doodles";
import { Link } from "@/i18n/navigation";
import { IconArrowRight } from "@tabler/icons-react";

const MAX_DISPLAYED = 3;

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

  // Curaté plutôt qu'exhaustif : trois suggestions gardent la section
  // lisible même si beaucoup de produits sont liés en base.
  const displayed = products.slice(0, MAX_DISPLAYED);

  return (
    <section className="mt-16 border-t border-stone-200 bg-[#F6F1E9] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="max-w-xl">
            <h2 className="font-[family-name:var(--font-courgette)] text-2xl text-stone-900 sm:text-3xl">
              {title}
            </h2>
            <Squiggle className="mt-1 h-2 w-20 opacity-50" color="#F4A261" />
            {intro && (
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{intro}</p>
            )}
          </div>

          {seeAllHref && seeAllLabel && (
            <Link
              href={seeAllHref}
              className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-[#1d4e5f] transition-colors hover:text-[#E63946] sm:inline-flex"
            >
              {seeAllLabel}
              <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((product) =>
            product.product_type === "circuit" ? (
              <CircuitCard key={product.id} circuit={product} />
            ) : (
              <ExcursionCard key={product.id} excursion={product} />
            ),
          )}
        </div>

        {seeAllHref && seeAllLabel && (
          <Link
            href={seeAllHref}
            className="mt-8 flex items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-[#1d4e5f] transition-colors hover:bg-stone-50 sm:hidden"
          >
            {seeAllLabel}
            <IconArrowRight size={16} />
          </Link>
        )}
      </div>
    </section>
  );
}
