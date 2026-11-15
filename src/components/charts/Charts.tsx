// Eigene, schlanke SVG-Diagramme: keine Diagramm-Bibliothek, gut lesbar in Hell und Dunkel.

export function ProgressBar({ value, max, level, label }: { value: number; max: number; level: "ok" | "warn" | "over"; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = level === "over" ? "bg-danger" : level === "warn" ? "bg-saffron" : "bg-pine";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      className="h-3 w-full overflow-hidden rounded-full bg-mist-strong"
    >
      <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BarChart({ data, format, label }: { data: { label: string; value: number; highlight?: boolean }[]; format: (v: number) => string; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure aria-label={label}>
      <div className="flex h-44 items-end gap-2 sm:gap-3" role="list">
        {data.map((d) => (
          <div key={d.label} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="num text-[0.72rem] font-semibold text-ink-soft">{d.value > 0 ? format(d.value) : ""}</span>
            <div
              className={`w-full max-w-12 rounded-t-md ${d.highlight ? "bg-pine" : "bg-pine/35"}`}
              style={{ height: `${Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${format(d.value)}`}
            />
            <span className="text-[0.78rem] text-ink-soft">{d.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Preisverlauf als Stufenlinie – jede Beobachtung bleibt als Punkt sichtbar */
export function PriceHistory({ points, format, label }: { points: { date: string; cents: number }[]; format: (v: number) => string; label: string }) {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;
  const W = 600, H = 180, P = 28;
  const t0 = new Date(sorted[0].date).getTime();
  const t1 = new Date(sorted[sorted.length - 1].date).getTime() || t0 + 1;
  const vals = sorted.map((p) => p.cents);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(1, (hi - lo) * 0.2);
  const x = (d: string) => P + ((new Date(d).getTime() - t0) / Math.max(1, t1 - t0)) * (W - 2 * P);
  const y = (c: number) => H - P - ((c - (lo - pad)) / (hi + pad - (lo - pad))) * (H - 2 * P);
  const path = sorted.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(1)},${y(p.cents).toFixed(1)}`).join(" ");
  return (
    <figure aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        <line x1={P} x2={W - P} y1={y(lo)} y2={y(lo)} stroke="var(--line)" strokeDasharray="4 4" />
        <line x1={P} x2={W - P} y1={y(hi)} y2={y(hi)} stroke="var(--line)" strokeDasharray="4 4" />
        <text x={W - P} y={y(hi) - 6} textAnchor="end" fontSize="13" fill="var(--ink-soft)">{format(hi)}</text>
        <text x={W - P} y={y(lo) + 16} textAnchor="end" fontSize="13" fill="var(--ink-soft)">{format(lo)}</text>
        <path d={path} fill="none" stroke="var(--pine)" strokeWidth="2.5" strokeLinejoin="round" />
        {sorted.map((p, i) => (
          <circle key={i} cx={x(p.date)} cy={y(p.cents)} r="4" fill="var(--paper)" stroke="var(--pine)" strokeWidth="2">
            <title>{`${p.date}: ${format(p.cents)}`}</title>
          </circle>
        ))}
      </svg>
    </figure>
  );
}
