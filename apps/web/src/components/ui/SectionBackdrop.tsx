import { Sparkle, Burst, HalfBurst, CurvedArrow, Blob } from "./Doodles";

export function SectionBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Lueur de coucher de soleil débordant du bandeau */}
      <div
        className="absolute left-1/2 top-0 h-[520px] w-[1100px] max-w-[160%] -translate-x-1/2 -translate-y-1/3"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(244,162,97,0.20) 0%, rgba(231,111,81,0.09) 38%, rgba(231,111,81,0) 70%)",
        }}
      />

      {/* Formes organiques très douces */}
      <Blob className="absolute -left-24 top-[320px] h-72 w-72 opacity-[0.045]" color="#1d4e5f" />
      <Blob className="absolute -right-28 top-[820px] h-80 w-80 rotate-[140deg] opacity-[0.05]" color="#E76F51" />

      {/* Décos dessinées — marges desktop uniquement */}
      <div className="hidden lg:block">
        <Burst className="absolute left-[3%] top-[150px] h-10 w-10 opacity-70" color="#F4A261" />
        <Sparkle className="absolute left-[7%] top-[240px] h-4 w-4 opacity-60" color="#E76F51" />
        <CurvedArrow className="absolute left-[2%] top-[430px] h-14 w-28 opacity-40" color="#1d4e5f" />

        <HalfBurst className="absolute right-[4%] top-[210px] h-9 w-11 opacity-65" color="#E76F51" />
        <Sparkle className="absolute right-[8%] top-[330px] h-5 w-5 opacity-50" color="#1d4e5f" />
        <Burst className="absolute right-[2%] top-[640px] h-8 w-8 opacity-50" color="#F4A261" />
        <Sparkle className="absolute right-[6%] top-[900px] h-3 w-3 opacity-45" color="#E76F51" />
        <HalfBurst className="absolute left-[4%] top-[880px] h-8 w-10 rotate-180 opacity-45" color="#F4A261" />
      </div>

      {/* Grain papier */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-multiply">
        <filter id="sakalava-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sakalava-grain)" />
      </svg>
    </div>
  );
}
