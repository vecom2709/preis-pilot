import type { Dictionary } from "@/i18n/dictionaries/de";

export type NavKey = "home" | "search" | "offers" | "lists" | "budget" | "radar" | "insights" | "account" | "scan";

export const routes: Record<NavKey, string> = {
  home: "",
  search: "/search",
  offers: "/offers",
  lists: "/lists",
  budget: "/budget",
  radar: "/radar",
  insights: "/insights",
  account: "/account",
  scan: "/scan",
};

/** Hauptnavigation wie im Entwurf */
export const headerNav: NavKey[] = ["home", "search", "offers", "lists", "budget", "insights"];
/** Alle Bereiche (Menü auf kleinen Bildschirmen) */
export const mainNav: NavKey[] = ["home", "search", "offers", "lists", "budget", "radar", "insights", "account"];

/** Multimedia-Welt: eigener Bereich mit dunklerem, technischem Erscheinungsbild */
export type MediaNavKey = "hub" | "compare" | "advisor" | "abos";
export const mediaRoutes: Record<MediaNavKey, string> = { hub: "/media", compare: "/media/compare", advisor: "/media/advisor", abos: "/media/abos" };
export const mediaNav: MediaNavKey[] = ["hub", "compare", "advisor", "abos"];

export function isMediaWorld(pathname: string, locale: string): boolean {
  return pathname === `/${locale}/media` || pathname.startsWith(`/${locale}/media/`);
}

export function isMediaActive(pathname: string, locale: string, key: MediaNavKey): boolean {
  const target = `/${locale}${mediaRoutes[key]}`;
  if (key === "hub") return pathname === target || pathname.startsWith(`/${locale}/media/c/`) || pathname.startsWith(`/${locale}/media/product`);
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function navLabel(key: NavKey, t: Dictionary): string {
  const map: Record<NavKey, string> = {
    home: t.nav.home,
    search: t.nav.search,
    offers: t.nav.offers,
    lists: t.nav.listsLong,
    budget: t.nav.budgetPlanner,
    radar: t.nav.radar,
    insights: t.nav.insights,
    account: t.nav.account,
    scan: t.nav.scan,
  };
  return map[key];
}

export function isActive(pathname: string, locale: string, key: NavKey): boolean {
  const target = `/${locale}${routes[key]}`;
  if (key === "home") return pathname === target || pathname === `${target}/`;
  return (
    pathname === target ||
    pathname.startsWith(`${target}/`) ||
    (key === "search" && (pathname.startsWith(`/${locale}/product/`) || pathname.startsWith(`/${locale}/categor`) || pathname.startsWith(`/${locale}/comparisons`)))
  );
}
