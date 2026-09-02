"use client";

import { useState } from "react";
import { IconMessagePlus, IconChevronDown } from "@tabler/icons-react";
import { ReviewForm } from "./ReviewForm";

type ProductOption = {
  slug: string;
  title: string;
  product_type: "circuit" | "excursion";
};

export function ReviewFormToggle({
  locale,
  lockedProduct,
  ctaLabel,
}: {
  locale: string;
  lockedProduct: { slug: string; title: string };
  ctaLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex items-center gap-2 rounded-full border border-[#1d4e5f]/15 bg-white px-6 py-3 text-sm font-medium text-[#1d4e5f] shadow-sm transition-colors hover:bg-[#FDFAF6]"
        >
          <IconMessagePlus size={18} />
          {ctaLabel}
        </button>
      )}

      {/* Le formulaire n'est pas du contenu à indexer (c'est une action),
          donc un montage conditionnel simple suffit ici — contrairement
          aux avis eux-mêmes qui restent toujours dans le HTML. */}
      {open && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mb-4 flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700"
          >
            <IconChevronDown size={16} className="rotate-180" />
            {ctaLabel}
          </button>
          <ReviewForm products={[] as ProductOption[]} locale={locale} lockedProduct={lockedProduct} />
        </div>
      )}
    </div>
  );
}
