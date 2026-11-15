// Kategorien: jede verweist auf echte Produkte mit dokumentierten Preisen in Open Prices.
// Drogerie, Haushalt und Tierbedarf stammen aus den Schwesterdatenbanken von Open Food Facts
// (Open Beauty Facts, Open Products Facts, Open Pet Food Facts).
import type { Locale } from "@/i18n/config";

export interface Category {
  slug: string;
  label: Record<Locale, string>;
  image: string | null;
  /** Filter für die Open-Prices-Produktsuche */
  filter: { source?: "off" | "obf" | "opff" | "opf"; categoriesTag?: string };
  featured?: boolean;
}

export const categories: Category[] = [
  { slug: "lebensmittel", featured: true, image: "/images/cat-lebensmittel.webp", label: { de: "Lebensmittel", it: "Alimentari", en: "Groceries" }, filter: { source: "off" } },
  { slug: "getraenke", featured: true, image: "/images/cat-getraenke.webp", label: { de: "Getränke", it: "Bevande", en: "Drinks" }, filter: { categoriesTag: "en:beverages" } },
  { slug: "haushalt", featured: true, image: "/images/cat-haushalt.webp", label: { de: "Haushalt", it: "Casa", en: "Household" }, filter: { source: "opf" } },
  { slug: "drogerie", featured: true, image: "/images/cat-drogerie.webp", label: { de: "Drogerie", it: "Cura persona", en: "Personal care" }, filter: { source: "obf" } },
  { slug: "baby-kind", featured: true, image: "/images/cat-baby.webp", label: { de: "Baby & Kind", it: "Bambini", en: "Baby & kids" }, filter: { categoriesTag: "en:baby-foods" } },
  { slug: "tierbedarf", featured: true, image: "/images/cat-tierbedarf.webp", label: { de: "Tierbedarf", it: "Animali", en: "Pet supplies" }, filter: { source: "opff" } },
  { slug: "milchprodukte", image: null, label: { de: "Milchprodukte", it: "Latticini", en: "Dairy" }, filter: { categoriesTag: "en:dairies" } },
  { slug: "obst-gemuese", image: null, label: { de: "Obst & Gemüse", it: "Frutta e verdura", en: "Fruit & veg" }, filter: { categoriesTag: "en:fruits-and-vegetables-based-foods" } },
  { slug: "brot-backwaren", image: null, label: { de: "Brot & Backwaren", it: "Pane e prodotti da forno", en: "Bread & bakery" }, filter: { categoriesTag: "en:breads" } },
  { slug: "fruehstueck", image: null, label: { de: "Frühstück", it: "Colazione", en: "Breakfast" }, filter: { categoriesTag: "en:breakfasts" } },
  { slug: "snacks-suesses", image: null, label: { de: "Snacks & Süßes", it: "Snack e dolci", en: "Snacks & sweets" }, filter: { categoriesTag: "en:snacks" } },
  { slug: "fleisch-wurst", image: null, label: { de: "Fleisch & Wurst", it: "Carne e salumi", en: "Meat & cold cuts" }, filter: { categoriesTag: "en:meats" } },
  { slug: "nudeln-reis", image: null, label: { de: "Nudeln & Reis", it: "Pasta e riso", en: "Pasta & rice" }, filter: { categoriesTag: "en:cereals-and-potatoes" } },
  { slug: "kaffee-tee", image: null, label: { de: "Kaffee & Tee", it: "Caffè e tè", en: "Coffee & tea" }, filter: { categoriesTag: "en:hot-beverages" } },
];

export function findCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
