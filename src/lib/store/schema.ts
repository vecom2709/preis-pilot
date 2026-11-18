// Lokales Datenmodell (ohne Konto, im Browser gespeichert). Jede Änderung wird mit Zod geprüft.
import { z } from "zod";

export const STORAGE_KEY = "preispilot:v1";

export const ListItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(120),
  quantity: z.number().positive().max(999),
  category: z.string().max(40).default(""),
  /** Preis je Packung/Stück in Cent */
  priceCents: z.number().int().nonnegative().nullable(),
  priceSource: z.enum(["manual", "open_prices", "deal"]).nullable(),
  priceDate: z.string().nullable(),
  priceStore: z.string().nullable(),
  productCode: z.string().nullable(),
  quantityText: z.string().nullable().default(null),
  checked: z.boolean().default(false),
});

/** Einkaufswagen: sammelt Artikel aus allen Rubriken, bevor daraus eine Einkaufsliste wird. Es wird nichts gekauft. */
export const CartItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["food", "product", "deal"]),
  /** Barcode (Lebensmittel) oder ID des erfassten Produkts */
  ref: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  detail: z.string().max(120).nullable().default(null),
  rubric: z.string().max(40).nullable().default(null),
  image: z.string().max(500).nullable().default(null),
  quantity: z.number().positive().max(999),
  priceCents: z.number().int().nonnegative().nullable(),
  priceSource: z.enum(["manual", "open_prices", "deal"]).nullable(),
  priceStore: z.string().max(80).nullable(),
  priceDate: z.string().nullable(),
  addedAt: z.string(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

/** Preisalarm auf ein gefundenes Angebot (Wunschpreis, Prüfung innerhalb der Plattform) */
export const DealWatchSchema = z.object({
  id: z.string(),
  dealId: z.string().max(160),
  country: z.enum(["DE", "IT"]),
  title: z.string().max(200),
  merchant: z.string().max(80),
  image: z.string().max(500).nullable(),
  gtin: z.string().nullable(),
  targetCents: z.number().int().positive(),
  lastCents: z.number().int().nonnegative().nullable(),
  lastCheck: z.string().nullable(),
  /** gesetzt, sobald der Wunschpreis erreicht wurde */
  hitAt: z.string().nullable(),
  expired: z.boolean().default(false),
  seen: z.boolean().default(false),
  createdAt: z.string(),
});
export type DealWatch = z.infer<typeof DealWatchSchema>;

export const ShoppingListSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  kind: z.enum(["shopping", "recurring", "pantry"]).default("shopping"),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(ListItemSchema),
});

export const BudgetSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  period: z.enum(["purchase", "day", "week", "month"]),
  limitCents: z.number().int().positive(),
  category: z.string().nullable(),
  member: z.string().nullable(),
  warnAtPercent: z.number().min(1).max(100).default(80),
});

export const PurchaseSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  store: z.string().max(80),
  amountCents: z.number().int().nonnegative(),
  kind: z.enum(["planned", "estimated", "paid"]),
  category: z.string().nullable(),
  member: z.string().nullable(),
  note: z.string().max(200).default(""),
  source: z.enum(["manual", "receipt", "list"]).default("manual"),
});

export const AlertSchema = z.object({
  id: z.string(),
  productCode: z.string(),
  productName: z.string(),
  thresholdCents: z.number().int().positive(),
  country: z.string(),
  createdAt: z.string(),
  notifiedIds: z.array(z.string()).default([]),
});

export const FavoriteSchema = z.object({
  code: z.string(),
  name: z.string(),
  quantityText: z.string().nullable(),
  addedAt: z.string(),
});

export const ScanSchema = z.object({ code: z.string(), name: z.string().nullable(), at: z.string() });

// ---------- Preis-Pilot 2.0 ----------
const specValue = z.union([z.string().max(200), z.number(), z.boolean()]);
export const MediaProductSchema = z.object({
  id: z.string(),
  category: z.string().max(40),
  schema: z.string().max(20),
  brand: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  model: z.string().max(60),
  specs: z.record(z.string(), specValue),
  specSource: z.string().url().max(500).nullable(),
  imageUrl: z.string().url().max(500).nullable(),
  wishlist: z.boolean(),
  createdAt: z.string(),
});
export const OfferSchema = z.object({
  id: z.string(),
  productId: z.string(),
  merchant: z.string().min(1).max(80),
  url: z.string().url().max(500).nullable(),
  priceCents: z.number().int().nonnegative(),
  shippingCents: z.number().int().nonnegative().nullable(),
  condition: z.enum(["new", "used", "refurbished", "demo", "digital", "subscription"]),
  availability: z.enum(["in_stock", "limited", "out_of_stock", "unknown"]),
  warrantyMonths: z.number().int().nonnegative().max(240).nullable(),
  observedAt: z.string(),
  source: z.enum(["manual", "feed"]),
  promo: z.string().max(200).nullable(),
  merchantImprint: z.boolean().nullable(),
});
export const WatchSchema = z.object({
  id: z.string(),
  productId: z.string(),
  thresholdCents: z.number().int().positive(),
  condition: OfferSchema.shape.condition,
  createdAt: z.string(),
  notifiedOfferIds: z.array(z.string()),
});
export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  category: z.enum(["video", "music", "gaming", "cloud", "software", "productivity", "media", "other"]),
  priceCents: z.number().int().nonnegative(),
  cycle: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minTermMonths: z.number().int().min(0).max(60).nullable(),
  renewalMonths: z.number().int().min(0).max(60).nullable(),
  notice: z.object({ value: z.number().int().min(0).max(365), unit: z.enum(["days", "weeks", "months"]) }).nullable(),
  status: z.enum(["active", "cancelled"]),
  endsOn: z.string().nullable(),
  usage: z.enum(["often", "sometimes", "rarely", "never"]).nullable(),
  yearlyOptionCents: z.number().int().nonnegative().nullable(),
  familyOption: z.object({ priceCents: z.number().int().nonnegative(), people: z.number().int().min(1).max(20) }).nullable(),
  priceHistory: z.array(z.object({ date: z.string(), priceCents: z.number().int().nonnegative() })),
});
export const SavingsGoalSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  targetCents: z.number().int().positive(),
  savedCents: z.number().int().nonnegative(),
  monthlyCents: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export const HouseholdPlanSchema = z.object({
  totalCents: z.number().int().nonnegative(),
  allocations: z.record(z.string(), z.number().int().nonnegative()),
});

export const SettingsSchema = z.object({
  country: z.enum(["DE", "IT"]).nullable().default(null),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  minSavingsCents: z.number().int().nonnegative().default(150),
  basketGroupBy: z.enum(["chain", "location"]).default("chain"),
});

export const AppDataSchema = z.object({
  version: z.literal(1),
  settings: SettingsSchema,
  lists: z.array(ShoppingListSchema),
  budgets: z.array(BudgetSchema),
  purchases: z.array(PurchaseSchema),
  alerts: z.array(AlertSchema),
  favorites: z.array(FavoriteSchema),
  scans: z.array(ScanSchema),
  // 2.0 – mit Standardwerten, damit gespeicherte 1.0-Daten weiter gelesen werden
  products: z.array(MediaProductSchema).default([]),
  offers: z.array(OfferSchema).default([]),
  watches: z.array(WatchSchema).default([]),
  subscriptions: z.array(SubscriptionSchema).default([]),
  savingsGoals: z.array(SavingsGoalSchema).default([]),
  householdPlan: HouseholdPlanSchema.nullable().default(null),
  cart: z.array(CartItemSchema).max(300).default([]),
  dealWatches: z.array(DealWatchSchema).max(200).default([]),
});

export type ListItem = z.infer<typeof ListItemSchema>;
export type ShoppingList = z.infer<typeof ShoppingListSchema>;
export type AppData = z.infer<typeof AppDataSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

export function emptyData(): AppData {
  return {
    version: 1,
    settings: SettingsSchema.parse({}),
    lists: [],
    budgets: [],
    purchases: [],
    alerts: [],
    favorites: [],
    scans: [],
    products: [],
    offers: [],
    watches: [],
    subscriptions: [],
    savingsGoals: [],
    householdPlan: null,
    cart: [],
    dealWatches: [],
  };
}
