import { z } from "zod";
import { parseQuery, rateLimited } from "@/lib/api";
import { SECTIONS, queryDeals } from "@/lib/deals/query";
import { dealsFor } from "@/lib/deals/server";
import { getDealStore, keys } from "@/lib/deals/store";
import type { RunLog } from "@/lib/deals/types";

const Query = z.object({ country: z.enum(["DE", "IT"]).default("DE"), limit: z.coerce.number().int().min(1).max(24).default(12) });

// Alle Startseiten-Bereiche in einer Antwort (eine Anfrage statt elf).
export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  const all = await dealsFor(q.country);
  const runs = (await (await getDealStore()).get<RunLog[]>(keys.runs)) ?? [];
  const sections = Object.fromEntries(SECTIONS.map((s) => {
    const r = queryDeals(all, { country: q.country, section: s, limit: q.limit, offset: 0 });
    return [s, { total: r.total, items: r.items }];
  }));
  return Response.json({ updatedAt: runs[0]?.finishedAt ?? null, sections }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
