import { z } from "zod";
import { langSchema, parseQuery, rateLimited, sourceFailure } from "@/lib/api";
import { normalizeBarcode } from "@/lib/barcode";
import { getProduct } from "@/lib/sources/off";

const Query = z.object({ lang: langSchema });

export async function GET(req: Request, ctx: RouteContext<"/api/product/[code]">) {
  const limited = await rateLimited(req);
  if (limited) return limited;
  const q = parseQuery(req, Query);
  if (q instanceof Response) return q;
  const { code: raw } = await ctx.params;
  const code = normalizeBarcode(raw);
  if (!code) return Response.json({ error: "invalid_code" }, { status: 400 });
  try {
    const product = await getProduct(code, q.lang);
    if (!product) return Response.json({ error: "not_found", code }, { status: 404 });
    return Response.json({ product });
  } catch (err) {
    return sourceFailure(err);
  }
}
