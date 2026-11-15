import { z } from "zod";
import { countrySchema, parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { assessObservations, offerStatus } from "@/lib/price-quality";
import { getDiscountedPrices } from "@/lib/sources/prices";

const Query = z.object({ country: countrySchema });

export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  try {
    const all = await getDiscountedPrices(q.country);
    const quality = assessObservations(all);
    const offers = all
      .filter((o) => quality.get(o.id)?.usable)
      .map((o) => ({ ...o, status: offerStatus(o), ageDays: quality.get(o.id)!.ageDays }));
    return Response.json({ country: q.country, fetchedAt: new Date().toISOString(), offers });
  } catch (err) {
    return sourceFailure(err);
  }
}
