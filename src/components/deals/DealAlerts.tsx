"use client";
// Preisalarme auf Angebote: Prüfung innerhalb der Plattform (höchstens alle 30 Minuten), Glocke im Kopfbereich,
// Übersicht im SparRadar mit ausgelösten, wartenden und abgelaufenen Alarmen.
import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { formatCents } from "@/lib/money";
import type { ScoredDeal } from "@/lib/deals/types";
import { getData, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { IconBell, IconTrash } from "@/components/ui/icons";
import { useAgo } from "./DealCard";

const EVERY = 30 * 60_000;
let running = false;

async function checkWatches() {
  if (running) return;
  running = true;
  try {
    const due = getData().dealWatches.filter((w) => !w.expired && (!w.lastCheck || Date.now() - Date.parse(w.lastCheck) > EVERY)).slice(0, 20);
    for (const w of due) {
      const res = await fetch(`/api/deals/item?id=${encodeURIComponent(w.dealId)}&country=${w.country}`).catch(() => null);
      if (!res?.ok) continue;
      const { deal } = (await res.json()) as { deal: ScoredDeal | null };
      const now = new Date().toISOString();
      updateData((d) => ({
        ...d,
        dealWatches: d.dealWatches.map((x) => {
          if (x.id !== w.id) return x;
          if (!deal) return { ...x, expired: true, lastCheck: now };
          const cents = deal.totalCents ?? deal.priceCents;
          const hit = cents <= x.targetCents;
          return { ...x, lastCents: cents, lastCheck: now, hitAt: hit ? (x.hitAt ?? now) : null, seen: hit ? x.seen && !!x.hitAt : false };
        }),
      }));
    }
  } finally {
    running = false;
  }
}

/** Glocke im Kopfbereich: zeigt ausgelöste, noch nicht gesehene Preisalarme */
export function AlertBell() {
  const { t, locale } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    void checkWatches();
    const timer = setInterval(() => void checkWatches(), EVERY);
    return () => clearInterval(timer);
  }, [hydrated]);
  const hits = hydrated ? data.dealWatches.filter((w) => w.hitAt && !w.seen && !w.expired).length : 0;
  if (!hits) return null;
  return (
    <Link href={`/${locale}/radar#angebotsalarme`} aria-label={fmt(t.deals.alerts.badge, { n: hits })} title={fmt(t.deals.alerts.badge, { n: hits })} className="relative grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10">
      <IconBell width={23} height={23} />
      <span className="num absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-saffron px-1 text-[0.72rem] font-bold text-petrol">{hits}</span>
    </Link>
  );
}

export function DealAlerts() {
  const { t, locale, intl } = useI18n();
  const data = useAppData();
  const hydrated = useHydrated();
  const ago = useAgo();
  const A = t.deals.alerts;
  const money = (c: number) => formatCents(c, intl);
  useEffect(() => {
    if (!hydrated) return;
    void checkWatches();
    updateData((d) => ({ ...d, dealWatches: d.dealWatches.map((w) => (w.hitAt ? { ...w, seen: true } : w)) }));
  }, [hydrated]);
  const watches = hydrated ? [...data.dealWatches].sort((a, b) => Number(!!b.hitAt) - Number(!!a.hitAt)) : [];
  return (
    <section id="angebotsalarme" aria-labelledby="da-title" className="scroll-mt-40 space-y-3">
      <h2 id="da-title" className="text-lg font-bold">{A.title}</h2>
      {!watches.length ? (
        <p className="text-ink-soft">{A.none}</p>
      ) : (
        <ul className="panel divide-y divide-line">
          {watches.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <Link href={`/${locale}/deal?id=${encodeURIComponent(w.dealId)}&country=${w.country}`} className="block truncate font-semibold hover:text-pine">{w.title}</Link>
                <span className="block text-sm text-ink-soft">{w.merchant}{w.lastCheck && ` · ${fmt(A.checked, { ago: ago(w.lastCheck) })}`}</span>
              </span>
              <span className={`text-sm font-semibold ${w.expired ? "text-ink-soft" : w.hitAt ? "text-saving" : "text-ink"}`}>
                {w.expired
                  ? fmt(A.expired, { price: w.lastCents !== null ? money(w.lastCents) : "–" })
                  : w.hitAt
                    ? fmt(A.hit, { price: money(w.lastCents ?? 0) })
                    : fmt(A.waiting, { target: money(w.targetCents), price: w.lastCents !== null ? money(w.lastCents) : "–" })}
              </span>
              {w.expired && <Link href={`/${locale}/offers?q=${encodeURIComponent(w.title.slice(0, 60))}`} className="btn btn-quiet btn-sm">{A.searchAgain}</Link>}
              <button type="button" aria-label={`${A.remove}: ${w.title}`} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-danger"
                onClick={() => updateData((d) => ({ ...d, dealWatches: d.dealWatches.filter((x) => x.id !== w.id) }))}>
                <IconTrash width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { IconBell };
