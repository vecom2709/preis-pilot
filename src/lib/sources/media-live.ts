import "server-only";
// Lizenzierte Live-Quellen für Multimedia: Spielepreise (IsThereAnyDeal) und Film-/Serien-Metadaten mit
// Streaming-Verfügbarkeit (TMDB, Verfügbarkeitsdaten von JustWatch). Beide brauchen einen kostenlosen Schlüssel.
// Ohne Schlüssel liefern die Routen eine verständliche Meldung – es wird nichts geschätzt oder ersetzt.
import { z } from "zod";
import { SourceError } from "./http";

const UA = "Preis-Pilot/0.2 (info@vecom-design.it)";

export const liveSources = {
  itad: { env: "ITAD_API_KEY", signup: "https://isthereanydeal.com/apps/my/" },
  tmdb: { env: "TMDB_API_TOKEN", signup: "https://www.themoviedb.org/settings/api" },
} as const;

export function missingKey(source: keyof typeof liveSources): Response | null {
  if (process.env[liveSources[source].env]) return null;
  return Response.json({ error: "missing_key", source, signup: liveSources[source].signup }, { status: 503 });
}

async function call(source: string, url: string, init: RequestInit = {}): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, headers: { "User-Agent": UA, Accept: "application/json", ...init.headers } });
    if (!res.ok) throw new SourceError(source, res.status, `HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    throw e instanceof SourceError ? e : new SourceError(source, null, e instanceof Error ? e.message : "Netzwerkfehler");
  } finally {
    clearTimeout(timer);
  }
}

// ---------- IsThereAnyDeal: nur autorisierte Shops, Preise in der Landeswährung ----------
const ItadSearch = z.array(z.object({ id: z.string(), title: z.string(), type: z.string().nullable().optional() }));
const ItadPrices = z.array(z.object({
  id: z.string(),
  deals: z.array(z.object({
    shop: z.object({ name: z.string() }),
    price: z.object({ amount: z.number(), currency: z.string() }),
    regular: z.object({ amount: z.number() }),
    cut: z.number(),
    drm: z.array(z.object({ name: z.string() })).default([]),
    platforms: z.array(z.object({ name: z.string() })).default([]),
    timestamp: z.string(),
    url: z.string(),
  })),
}));

export interface GameDeal { shop: string; priceCents: number; regularCents: number; cut: number; currency: string; drm: string[]; platforms: string[]; observedAt: string; url: string }

export async function searchGames(q: string, country: string): Promise<{ id: string; title: string; deals: GameDeal[] }[]> {
  const key = process.env.ITAD_API_KEY!;
  const games = ItadSearch.parse(await call("itad", `https://api.isthereanydeal.com/games/search/v1?key=${encodeURIComponent(key)}&title=${encodeURIComponent(q)}&results=8`))
    .filter((g) => !g.type || g.type === "game");
  if (!games.length) return [];
  const prices = ItadPrices.parse(await call("itad", `https://api.isthereanydeal.com/games/prices/v3?key=${encodeURIComponent(key)}&country=${country}`, {
    method: "POST", body: JSON.stringify(games.map((g) => g.id)), headers: { "Content-Type": "application/json" },
  }));
  return games.map((g) => ({
    id: g.id,
    title: g.title,
    deals: (prices.find((p) => p.id === g.id)?.deals ?? []).map((d) => ({
      shop: d.shop.name,
      priceCents: Math.round(d.price.amount * 100),
      regularCents: Math.round(d.regular.amount * 100),
      cut: d.cut,
      currency: d.price.currency,
      drm: d.drm.map((x) => x.name),
      platforms: d.platforms.map((x) => x.name),
      observedAt: d.timestamp,
      url: d.url,
    })).sort((a, b) => a.priceCents - b.priceCents),
  }));
}

// ---------- TMDB: Metadaten + Streaming-Verfügbarkeit je Land (nur Verweise, keine Inhalte) ----------
const TmdbSearch = z.object({ results: z.array(z.object({
  id: z.number(), media_type: z.string(), title: z.string().optional(), name: z.string().optional(),
  release_date: z.string().optional(), first_air_date: z.string().optional(),
})) });
const Provider = z.object({ provider_name: z.string() });
const TmdbProviders = z.object({ results: z.record(z.string(), z.object({
  link: z.string().optional(), flatrate: z.array(Provider).optional(), rent: z.array(Provider).optional(), buy: z.array(Provider).optional(),
})) });

export interface TitleHit { id: number; type: "movie" | "tv"; title: string; year: number | null; flatrate: string[] | null; rent: string[] | null; buy: string[] | null; link: string | null }

const tmdbLang = { de: "de-DE", it: "it-IT", en: "en-GB" } as const;

export async function searchTitles(q: string, lang: keyof typeof tmdbLang, country: string): Promise<TitleHit[]> {
  const headers = { Authorization: `Bearer ${process.env.TMDB_API_TOKEN}` };
  const s = TmdbSearch.parse(await call("tmdb", `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=${tmdbLang[lang]}&include_adult=false&page=1`, { headers }));
  const hits = s.results.filter((r) => r.media_type === "movie" || r.media_type === "tv").slice(0, 6);
  return Promise.all(hits.map(async (h) => {
    const type = h.media_type as "movie" | "tv";
    const p = TmdbProviders.parse(await call("tmdb", `https://api.themoviedb.org/3/${type}/${h.id}/watch/providers`, { headers }));
    const c = p.results[country];
    const date = h.release_date || h.first_air_date || "";
    // Kein Eintrag für das Land = Verfügbarkeit unbekannt (null), nicht „nicht verfügbar“
    return {
      id: h.id, type, title: h.title ?? h.name ?? "", year: date ? Number(date.slice(0, 4)) : null,
      flatrate: c ? (c.flatrate ?? []).map((x) => x.provider_name) : null,
      rent: c ? (c.rent ?? []).map((x) => x.provider_name) : null,
      buy: c ? (c.buy ?? []).map((x) => x.provider_name) : null,
      link: c?.link ?? null,
    };
  }));
}
