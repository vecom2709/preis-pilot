// Abbildung der Open-Food-Facts-Antworten auf Preis-Pilot-Typen (rein, ohne Netzwerk – testbar).
import { z } from "zod";
import { parseQuantity, toQuantity } from "../units";
import type { Product, SearchHit } from "./types";

const OffProductSchema = z
  .object({
    code: z.string().optional(),
    product_name: z.string().nullish(),
    product_name_de: z.string().nullish(),
    product_name_it: z.string().nullish(),
    product_name_en: z.string().nullish(),
    brands: z.union([z.string(), z.array(z.string())]).nullish(),
    quantity: z.string().nullish(),
    product_quantity: z.union([z.number(), z.string()]).nullish(),
    product_quantity_unit: z.string().nullish(),
    image_front_small_url: z.string().nullish(),
    image_front_url: z.string().nullish(),
    categories_tags: z.array(z.string()).nullish(),
    nutriscore_grade: z.string().nullish(),
  })
  .passthrough();

export const OffV3ResponseSchema = z.object({
  code: z.string(),
  status: z.string(),
  product: OffProductSchema.optional(),
});

export const SEARCH_FIELDS =
  "code,product_name,product_name_de,product_name_it,product_name_en,brands,quantity,image_front_small_url";

export const PRODUCT_FIELDS =
  "code,product_name,product_name_de,product_name_it,product_name_en,brands,quantity,product_quantity,product_quantity_unit,image_front_small_url,image_front_url,categories_tags,nutriscore_grade";

type OffProduct = z.infer<typeof OffProductSchema>;

function localizedName(p: OffProduct, lang: string): string | null {
  const byLang = (p as Record<string, unknown>)[`product_name_${lang}`];
  const name = (typeof byLang === "string" && byLang.trim()) || p.product_name?.trim() || p.product_name_en?.trim();
  return name || null;
}

function firstBrand(brands: OffProduct["brands"]): string | null {
  if (!brands) return null;
  const list = Array.isArray(brands) ? brands : brands.split(",");
  return list.map((b) => b.trim()).find(Boolean) ?? null;
}

function cleanImage(url: string | null | undefined): string | null {
  return url && url.startsWith("https://images.openfoodfacts.org/") ? url : null;
}

export function mapOffProduct(json: unknown, lang: string): Product | null {
  const parsed = OffV3ResponseSchema.safeParse(json);
  if (!parsed.success || parsed.data.status === "failure" || !parsed.data.product) return null;
  const p = parsed.data.product;
  const code = parsed.data.code;
  const amount = p.product_quantity != null ? Number(p.product_quantity) : NaN;
  const qty =
    (Number.isFinite(amount) && p.product_quantity_unit ? toQuantity(amount, p.product_quantity_unit) : null) ??
    parseQuantity(p.quantity);
  return {
    code,
    name: localizedName(p, lang),
    brand: firstBrand(p.brands),
    quantityText: p.quantity?.trim() || null,
    packageBase: qty?.base ?? null,
    packageDimension: qty?.dimension ?? null,
    imageUrl: cleanImage(p.image_front_url ?? p.image_front_small_url),
    categories: p.categories_tags ?? [],
    nutriscore: p.nutriscore_grade && /^[a-e]$/.test(p.nutriscore_grade) ? p.nutriscore_grade : null,
    source: "open_food_facts",
    sourceUrl: `https://world.openfoodfacts.org/product/${code}`,
  };
}

const SearchResponseSchema = z.object({
  hits: z.array(OffProductSchema),
  count: z.number().optional(),
  page: z.number().optional(),
  page_count: z.number().optional(),
});

export function mapSearchResponse(json: unknown, lang: string): { hits: SearchHit[]; total: number } {
  const parsed = SearchResponseSchema.safeParse(json);
  if (!parsed.success) return { hits: [], total: 0 };
  const hits = parsed.data.hits
    .filter((h) => typeof h.code === "string" && /^\d{8,14}$/.test(h.code))
    .map((h) => ({
      code: h.code!,
      name: localizedName(h, lang),
      brand: firstBrand(h.brands),
      quantityText: h.quantity?.trim() || null,
      imageUrl: cleanImage(h.image_front_small_url),
    }))
    .filter((h) => h.name);
  return { hits, total: parsed.data.count ?? hits.length };
}
