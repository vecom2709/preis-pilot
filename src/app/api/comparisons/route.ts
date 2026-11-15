import { z } from "zod";
import { countrySchema, parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { getComparisons } from "@/lib/sources/catalog";

const Query = z.object({ country: countrySchema });

/** Echte Ketten-Vergleiche (nur geprüfte Preise der letzten 365 Tage). */
export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  try {
    return Response.json({ country: q.country, comparisons: await getComparisons(q.country) });
  } catch (err) {
    return sourceFailure(err);
  }
}
