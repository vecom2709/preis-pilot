// Filter, Sortierung und Startseiten-Bereiche über bewertete Angebote (rein, ohne Speicherzugriff).
import { z } from "zod";
import type { ScoredDeal } from "./types";

export const SECTIONS = ["top", "drops", "mega", "under10", "under25", "under50", "discount", "food", "tech", "auto", "new"] as const;
export type Section = (typeof SECTIONS)[number];

const FOOD = ["lebensmittel-getraenke", "supermarkt-discounter"];
const TECH = ["multimedia-elektronik", "tv-audio-heimkino", "smartphones-tablets", "computer-notebooks", "gaming-konsolen", "smart-home-sicherheit", "digitale-produkte-software"];
const AUTO = ["auto-teile-reifen", "motorrad-fahrrad"];

export const DealQuerySchema = z.object({
  country: z.enum(["DE", "IT"]).default("DE"),
  section: z.enum(SECTIONS).optional(),
  category: z.string().max(40).optional(),
  /** mehrere Kategorien, kommagetrennt (z. B. alle Kategorien einer Rubrik) */
  categories: z.string().max(600).optional(),
  q: z.string().trim().max(100).optional(),
  merchant: z.string().max(80).optional(),
  max: z.coerce.number().positive().max(100000).optional(),
  condition: z.enum(["new", "used", "refurbished", "bware", "digital"]).optional(),
  freeShipping: z.enum(["1"]).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  sort: z.enum(["total", "discount", "score", "new"]).optional(),
  limit: z.coerce.number().int().min(1).max(120).default(24),
  offset: z.coerce.number().int().min(0).max(5000).default(0),
});
export type DealQuery = z.infer<typeof DealQuerySchema>;

const effective = (d: ScoredDeal) => d.totalCents ?? d.priceCents;
const available = (d: ScoredDeal) => d.availability !== "out_of_stock";

export function sectionFilter(section: Section, now = new Date()): { test: (d: ScoredDeal) => boolean; sort: DealQuery["sort"] } {
  const recent = (iso: string | null, days: number) => !!iso && now.getTime() - Date.parse(iso) <= days * 86_400_000;
  switch (section) {
    case "top": return { test: available, sort: "score" };
    case "drops": return { test: (d) => available(d) && recent(d.priceDropAt, 7), sort: "new" };
    case "mega": return { test: (d) => available(d) && d.score >= 70 && (d.discountPercent ?? 0) >= 60 && d.basis?.kind !== "rrp" && !d.reasons.some((r) => r.code === "price_error_suspect"), sort: "score" };
    case "under10": return { test: (d) => available(d) && d.totalCents !== null && d.totalCents <= 1000, sort: "score" };
    case "under25": return { test: (d) => available(d) && d.totalCents !== null && d.totalCents <= 2500, sort: "score" };
    case "under50": return { test: (d) => available(d) && d.totalCents !== null && d.totalCents <= 5000, sort: "score" };
    case "discount": return { test: (d) => available(d) && d.discountPercent !== null, sort: "discount" };
    case "food": return { test: (d) => FOOD.includes(d.category), sort: "score" };
    case "tech": return { test: (d) => available(d) && TECH.includes(d.category), sort: "score" };
    case "auto": return { test: (d) => available(d) && AUTO.includes(d.category), sort: "score" };
    case "new": return { test: available, sort: "new" };
  }
}

export function sortDeals(list: ScoredDeal[], sort: NonNullable<DealQuery["sort"]>): ScoredDeal[] {
  const s = [...list];
  if (sort === "total") s.sort((a, b) => (a.totalCents ?? Infinity) - (b.totalCents ?? Infinity));
  if (sort === "discount") s.sort((a, b) => (b.discountPercent ?? -1) - (a.discountPercent ?? -1) || b.score - a.score);
  if (sort === "score") s.sort((a, b) => b.score - a.score);
  if (sort === "new") s.sort((a, b) => (b.priceDropAt ?? b.firstSeen).localeCompare(a.priceDropAt ?? a.firstSeen));
  return s;
}

export function queryDeals(all: ScoredDeal[], q: DealQuery, now = new Date()) {
  let list = all;
  let sort = q.sort;
  if (q.section) {
    const s = sectionFilter(q.section, now);
    list = list.filter(s.test);
    sort ??= s.sort;
  }
  if (q.category) list = list.filter((d) => d.category === q.category);
  if (q.categories) {
    const set = new Set(q.categories.split(","));
    list = list.filter((d) => set.has(d.category));
  }
  if (q.merchant) list = list.filter((d) => d.merchant === q.merchant);
  if (q.condition) list = list.filter((d) => d.condition === q.condition);
  if (q.freeShipping) list = list.filter((d) => d.delivery !== "online" || d.shippingCents === 0);
  if (q.max) list = list.filter((d) => effective(d) <= q.max! * 100);
  if (q.minScore !== undefined) list = list.filter((d) => d.score >= q.minScore!);
  if (q.q) {
    const words = q.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((d) => {
      const hay = `${d.title} ${d.brand ?? ""} ${d.merchant} ${d.gtin ?? ""} ${d.subcategory ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  const sorted = sortDeals(list, sort ?? "score");
  const count = (key: (d: ScoredDeal) => string | null) => {
    const m = new Map<string, number>();
    for (const d of list) { const k = key(d); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([value, n]) => ({ value, n }));
  };
  return {
    total: sorted.length,
    items: sorted.slice(q.offset, q.offset + q.limit),
    facets: { categories: count((d) => d.category), merchants: count((d) => d.merchant), subcategories: count((d) => d.subcategory) },
  };
}
