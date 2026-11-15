// Bildmarke: schräg gestelltes Preisschild mit Loch, Verlauf in Türkis – eigene Zeichnung.
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="pp-tag" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0fb5a6" />
          <stop offset="1" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <g transform="rotate(-38 24 24)">
        <path d="M8 16a4 4 0 0 1 4-4h20l9 12-9 12H12a4 4 0 0 1-4-4z" fill="url(#pp-tag)" />
        <circle cx="31" cy="24" r="3.4" fill="var(--petrol)" />
      </g>
    </svg>
  );
}

export function Logo({ onDark = false, tagline }: { onDark?: boolean; tagline?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className={`block text-[1.55rem] font-extrabold tracking-[-0.025em] ${onDark ? "text-white" : "text-ink"}`}>Preis-Pilot</span>
        {tagline && <span className={`mt-1 hidden text-[0.72rem] font-medium sm:block xl:hidden 2xl:block ${onDark ? "text-white/85" : "text-ink-soft"}`}>{tagline}</span>}
      </span>
    </span>
  );
}
