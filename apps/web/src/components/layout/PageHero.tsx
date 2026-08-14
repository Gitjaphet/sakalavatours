import Image from "next/image";
import { Link } from "@/i18n/navigation";

type Crumb = {
  label: string;
  href?: string;
};

type PageHeroProps = {
  title: string;
  eyebrow?: string;
  intro?: string;
  breadcrumb: Crumb[];
  image: string;
  imageAlt?: string;
};

export function PageHero({
  title,
  eyebrow,
  intro,
  breadcrumb,
  image,
  imageAlt = "",
}: PageHeroProps) {
  return (
    <section className="relative isolate h-[340px] w-full overflow-hidden sm:h-[420px] md:h-[460px] lg:h-[500px]">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#1d4e5f]/55 mix-blend-multiply"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#08222b]/80 via-[#08222b]/45 to-[#08222b]/70"
      />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-32 md:pt-36 lg:px-8 lg:pb-16 lg:pt-44">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-white/70 sm:gap-x-2 sm:text-sm">
            {breadcrumb.map((crumb, i) => {
              const isLast = i === breadcrumb.length - 1;
              return (
                <li key={crumb.label} className="flex items-center gap-x-1.5 sm:gap-x-2">
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

        <h1 className="mt-2.5 font-[family-name:var(--font-courgette)] text-[1.75rem] leading-tight text-white drop-shadow-sm sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
          {title}
        </h1>

        <span
          aria-hidden="true"
          className="mt-3 block h-1 w-14 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] sm:mt-4 sm:w-20"
        />

        {intro && (
          <p className="mt-3.5 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:mt-5 sm:line-clamp-none sm:text-base lg:text-lg">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
