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
