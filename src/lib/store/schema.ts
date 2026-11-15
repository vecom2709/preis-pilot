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
  priceSource: z.enum(["manual", "open_prices"]).nullable(),
  priceDate: z.string().nullable(),
  priceStore: z.string().nullable(),
  productCode: z.string().nullable(),
  quantityText: z.string().nullable().default(null),
  checked: z.boolean().default(false),
});

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
  };
}
