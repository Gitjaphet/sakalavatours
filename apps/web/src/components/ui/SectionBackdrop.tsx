const DOTS = [
  { left: "6%",  top: "8%",  size: 3, tone: "lagoon", dur: "5s",   delay: "0s" },
  { left: "14%", top: "22%", size: 2, tone: "sun",    dur: "6.5s", delay: "1.2s" },
  { left: "22%", top: "5%",  size: 2, tone: "lagoon", dur: "4.5s", delay: "2.4s" },
  { left: "38%", top: "14%", size: 4, tone: "sun",    dur: "7s",   delay: "0.6s" },
  { left: "47%", top: "3%",  size: 2, tone: "lagoon", dur: "5.5s", delay: "3s" },
  { left: "61%", top: "18%", size: 3, tone: "sun",    dur: "6s",   delay: "1.8s" },
  { left: "72%", top: "7%",  size: 2, tone: "lagoon", dur: "4.8s", delay: "0.3s" },
  { left: "84%", top: "20%", size: 3, tone: "sun",    dur: "6.8s", delay: "2.1s" },
  { left: "93%", top: "10%", size: 2, tone: "lagoon", dur: "5.2s", delay: "1.5s" },
];

export function SectionBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 1. Lueur de coucher de soleil qui déborde du bandeau */}
      <div
        className="absolute left-1/2 top-0 h-[520px] w-[1100px] max-w-[160%] -translate-x-1/2 -translate-y-1/3"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(244,162,97,0.22) 0%, rgba(231,111,81,0.10) 38%, rgba(231,111,81,0) 70%)",
        }}
      />

      {/* 2. Halo lagon en contrepoint, décalé à droite */}
      <div
        className="absolute right-0 top-[220px] h-[560px] w-[720px] max-w-[110%] translate-x-1/3"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(29,78,95,0.10) 0%, rgba(29,78,95,0) 68%)",
        }}
      />

      {/* 3. Arc d'horizon */}
      <div className="absolute left-1/2 top-[70px] h-[900px] w-[190%] -translate-x-1/2 rounded-[50%] border-t border-[#1d4e5f]/15" />
      <div className="absolute left-1/2 top-[86px] h-[900px] w-[190%] -translate-x-1/2 rounded-[50%] border-t border-[#E76F51]/10" />

      {/* 4. Particules */}
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            backgroundColor: d.tone === "sun" ? "#E76F51" : "#1d4e5f",
            opacity: 0.35,
            animationDuration: d.dur,
            animationDelay: d.delay,
          }}
        />
      ))}

      {/* 5. Grain papier */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-multiply">
        <filter id="sakalava-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sakalava-grain)" />
      </svg>
    </div>
  );
}
