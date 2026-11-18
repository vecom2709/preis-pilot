import { z } from "zod";
import { parseQuery, rateLimited } from "@/lib/api";
import { dealsFor } from "@/lib/deals/server";
import { getDealStore, keys } from "@/lib/deals/store";
import type { HistoryMap } from "@/lib/deals/types";

const Query = z.object({ id: z.string().min(3).max(160), country: z.enum(["DE", "IT"]).default("DE") });

// Ein Angebot mit eigenem Preisverlauf und Angeboten anderer Händler für dieselbe GTIN (gleicher Zustand).
export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  const all = await dealsFor(q.country);
  const deal = all.find((d) => d.id === q.id) ?? null;
  const history = ((await (await getDealStore()).get<HistoryMap>(keys.history(q.country))) ?? {})[q.id] ?? [];
  const others = deal?.gtin ? all.filter((d) => d.gtin === deal.gtin && d.condition === deal.condition && d.id !== deal.id).sort((a, b) => (a.totalCents ?? Infinity) - (b.totalCents ?? Infinity)) : [];
  return Response.json({ deal, history, others }, { headers: { "Cache-Control": "public, max-age=60" } });
}
