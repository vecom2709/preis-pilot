import { z } from "zod";
import { countrySchema, parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { isValidGtin } from "@/lib/barcode";
import { assessObservations } from "@/lib/price-quality";
import { getPricesForCodes } from "@/lib/sources/prices";

const Query = z.object({
  codes: z
    .string()
    .transform((s) => s.split(",").map((c) => c.trim()).filter(Boolean))
    .pipe(z.array(z.string().refine(isValidGtin, "invalid_code")).min(1).max(40)),
  country: countrySchema,
});

/** Dokumentierte Preise für ein oder mehrere Produkte inkl. Qualitätsbewertung je Eintrag. */
export async function GET(req: Request) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  try {
    const observations = await getPricesForCodes(q.codes, q.country);
    const quality = assessObservations(observations);
    return Response.json({
      country: q.country,
      fetchedAt: new Date().toISOString(),
      observations: observations.map((o) => ({ ...o, quality: quality.get(o.id) })),
    });
  } catch (err) {
    return sourceFailure(err);
  }
}
