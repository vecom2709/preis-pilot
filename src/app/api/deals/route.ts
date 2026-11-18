import { parseQuery, rateLimited } from "@/lib/api";
import { DealQuerySchema, queryDeals } from "@/lib/deals/query";
import { dealsFor, liveSearch } from "@/lib/deals/server";

// Angebote mit Filtern, Sortierung und Startseiten-Bereichen. Bei Suchbegriffen zusätzlich Live-Suche
// bei freigeschalteten Quellen (z. B. eBay).
export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, DealQuerySchema);
  if (q instanceof Response) return q;
  let all = await dealsFor(q.country);
  if (q.q && q.q.length >= 3) {
    const live = await liveSearch(q.q, q.country);
    const ids = new Set(all.map((d) => d.id));
    all = [...all, ...live.filter((d) => !ids.has(d.id))];
  }
  const result = queryDeals(all, q);
  return Response.json(result, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
