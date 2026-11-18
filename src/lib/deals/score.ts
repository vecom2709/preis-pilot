// Preis-Pilot-Deal-Score (0–100) – nachvollziehbar, jede Punktzahl mit Grund. Fehlende Daten geben
// keine Pluspunkte und werden nie geschätzt.
import type { Deal, Reference, ScoreReason, ScoredDeal } from "./types";

/** Vertrauen in die Bezugsgröße: eigene/Markt-Daten vor Händler-Angabe vor UVP */
const BASIS_ORDER: Reference["kind"][] = ["lowest30", "market", "merchant_previous", "rrp"];
const BASIS_WEIGHT: Record<Reference["kind"], number> = { lowest30: 1, market: 0.9, merchant_previous: 0.75, rrp: 0.5 };

export function totalCents(d: Pick<Deal, "priceCents" | "shippingCents" | "delivery">): number | null {
  if (d.delivery !== "online") return d.priceCents; // digital oder Filiale: kein Versand
  return d.shippingCents === null ? null : d.priceCents + d.shippingCents;
}

/** Rabatt nur gegen eine echte, höhere Bezugsgröße – sonst keine Rabattanzeige. */
export function pickBasis(d: Pick<Deal, "priceCents" | "references">): Reference | null {
  for (const kind of BASIS_ORDER) {
    const r = d.references.find((x) => x.kind === kind);
    if (r && r.cents > d.priceCents) return r;
  }
  return null;
}

export interface ScoreContext {
  now: Date;
  /** günstigster bekannter Gesamtpreis anderer Händler für dieselbe GTIN (gleicher Zustand) */
  cheapestOther: { merchant: string; totalCents: number } | null;
  /** eigener Preisverlauf dieses Angebots (Tag, Cent), älteste zuerst */
  history: [string, number][];
  trustedSource: boolean;
}

export function scoreDeal(d: Deal, ctx: ScoreContext): ScoredDeal {
  const reasons: ScoreReason[] = [];
  const add = (code: string, points: number, params?: ScoreReason["params"]) => reasons.push({ code, points, params });
  const total = totalCents(d);
  const basis = pickBasis(d);
  const discount = basis ? Math.round(((basis.cents - d.priceCents) / basis.cents) * 100) : null;
  const saving = basis ? basis.cents - d.priceCents : null;

  // 1) Ersparnis gegenüber belastbarer Bezugsgröße (max. 40)
  if (basis && discount !== null) {
    const pts = Math.round(Math.min(40, discount * 0.8) * BASIS_WEIGHT[basis.kind]);
    add(`discount_${basis.kind}`, pts, { pct: discount });
  } else add("no_reference", 0);

  // 2) Vergleich mit anderen Händlern (–15 … +15)
  if (ctx.cheapestOther && total !== null) {
    if (ctx.cheapestOther.totalCents < total) add("cheaper_elsewhere", -15, { merchant: ctx.cheapestOther.merchant });
    else add("cheapest_compared", 15);
  }

  // 3) Eigener Verlauf (max. 15) – nur mit echten Beobachtungen über mindestens 7 Tage
  const days = ctx.history.length;
  if (days >= 2) {
    const span = (Date.parse(ctx.history[days - 1][0]) - Date.parse(ctx.history[0][0])) / 86_400_000;
    const low = Math.min(...ctx.history.map(([, c]) => c));
    if (span >= 7 && d.priceCents <= low) add("lowest_observed", 15, { days: Math.round(span) });
    else if (span >= 7) add("above_observed_low", 0, { days: Math.round(span) });
  } else add("no_history", 0);

  // 4) Verfügbarkeit, Versand, Zustand, Aktualität, Quelle (max. 30)
  if (d.availability === "in_stock") add("in_stock", 8);
  else if (d.availability === "limited") add("limited", 4);
  else if (d.availability === "out_of_stock") add("out_of_stock", -30);
  else add("availability_unknown", 0);
  if (d.delivery === "online") {
    if (d.shippingCents === 0) add("free_shipping", 6);
    else if (d.shippingCents === null) add("shipping_unknown", -6);
  } else add(d.delivery === "digital" ? "digital_delivery" : "store_price", 4);
  if (d.condition === "new" || d.condition === "digital") add("new_goods", 4);
  else add("not_new", -4);
  const ageH = (ctx.now.getTime() - Date.parse(d.observedAt)) / 3_600_000;
  if (ageH <= 24) add("fresh", 6);
  else if (ageH > 24 * 7) add("stale", -10);
  if (d.coupon) add("coupon", 2);
  if (d.sellerRating !== null) add(d.sellerRating >= 98 ? "seller_trusted" : d.sellerRating < 95 ? "seller_weak" : "seller_ok", d.sellerRating >= 98 ? 4 : d.sellerRating < 95 ? -8 : 0, { rating: d.sellerRating });
  else if (ctx.trustedSource) add("source_trusted", 2);

  // 5) Preisfehler-Verdacht (Hinweis, keine Punkte): ungewöhnlich hoher Nachlass gegenüber belastbarer Bezugsgröße.
  //    Digitale Spiele sind oft 75–90 % reduziert, dort erst ab 95 %.
  const suspectAt = d.delivery === "digital" ? 95 : 70;
  if (discount !== null && discount >= suspectAt && basis && basis.kind !== "rrp") add("price_error_suspect", 0, { pct: discount });

  const raw = 20 + reasons.reduce((n, r) => n + r.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const drop = ctx.history.length >= 2 && ctx.history[ctx.history.length - 2][1] > d.priceCents ? ctx.history[ctx.history.length - 1][0] : null;
  return {
    ...d,
    totalCents: total,
    basis,
    discountPercent: discount,
    savingCents: saving,
    score,
    reasons,
    cheaperElsewhere: ctx.cheapestOther && total !== null && ctx.cheapestOther.totalCents < total ? ctx.cheapestOther : null,
    priceDropAt: drop,
  };
}
