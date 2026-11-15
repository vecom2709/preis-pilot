import { z } from "zod";
import { countries } from "@/i18n/config";
import { countrySchema, langSchema, parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { normalizeBarcode } from "@/lib/barcode";
import { searchProducts } from "@/lib/sources/off";
import { getPriceCounts } from "@/lib/sources/prices";

const Query = z.object({
  q: z.string().trim().min(2).max(100),
  lang: langSchema,
  country: countrySchema,
  onlyCountry: z.enum(["0", "1"]).default("1"),
  page: z.coerce.number().int().min(1).max(20).default(1),
});

export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;

  // Eine gültige Barcode-Eingabe führt direkt zum Produkt
  const barcode = normalizeBarcode(q.q);
  if (barcode) return Response.json({ barcode });

  try {
    const { hits, total } = await searchProducts(q.q, q.lang, q.page, q.onlyCountry === "1" ? countries[q.country].offTag : undefined);
    const counts = await getPriceCounts(hits.map((h) => h.code)).catch(() => ({}) as Record<string, number>);
    return Response.json({
      total,
      page: q.page,
      hits: hits.map((h) => ({ ...h, priceCount: counts[h.code] ?? 0 })),
    });
  } catch (err) {
    return sourceFailure(err);
  }
}
