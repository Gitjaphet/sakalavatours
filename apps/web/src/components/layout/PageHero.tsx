import Image from "next/image";
import { Link } from "@/i18n/navigation";

type Crumb = {
  label: string;
  href?: string;
};

type PageHeroProps = {
  title: string;
  intro?: string;
  breadcrumb: Crumb[];
  image: string;
  imageAlt?: string;
};

export function PageHero({
  title,
  intro,
  breadcrumb,
  image,
  imageAlt = "",
}: PageHeroProps) {
  return (
    <section className="relative isolate h-[380px] w-full overflow-hidden sm:h-[450px] lg:h-[500px]">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Scrim 1 : teinte lagon, ramène la photo dans la charte */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#1d4e5f]/55 mix-blend-multiply"
      />
      {/* Scrim 2 : dégradé vertical pour la lisibilité du titre */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#08222b]/80 via-[#08222b]/45 to-[#08222b]/70"
      />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-14 pt-32 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8 lg:pt-44">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/70">
            {breadcrumb.map((crumb, i) => {
              const isLast = i === breadcrumb.length - 1;
              return (
                <li key={crumb.label} className="flex items-center gap-x-2">
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? "font-medium text-white" : undefined}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && (
                    <span aria-hidden="true" className="text-white/40">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <h1 className="mt-4 font-[family-name:var(--font-courgette)] text-4xl leading-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
          {title}
        </h1>

        <span
          aria-hidden="true"
          className="mt-4 block h-1 w-20 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51]"
        />

        {intro && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
