"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { IconCompare, IconCompass, IconHome, IconList, IconPlay, IconScan, IconScreen, IconSearch, IconWallet } from "@/components/ui/icons";
import { isActive, isMediaActive, isMediaWorld, mediaRoutes, routes, type NavKey } from "./nav";

// Mobile Navigation: die häufigsten Aufgaben mit dem Daumen erreichbar, Scannen in der Mitte.
export function BottomNav() {
  return <BottomNavView pathname={usePathname()} />;
}

/** Ohne aktiven Pfad nutzbar – dient als statischer Platzhalter beim Vorab-Rendern */
export function BottomNavView({ pathname }: { pathname: string }) {
  const { locale, t } = useI18n();
  const food: { key: NavKey; label: string; Icon: typeof IconHome }[] = [
    { key: "home", label: t.nav.home, Icon: IconHome },
    { key: "search", label: t.nav.search, Icon: IconSearch },
    { key: "scan", label: t.nav.scan, Icon: IconScan },
    { key: "lists", label: t.nav.lists, Icon: IconList },
    { key: "budget", label: t.nav.budget, Icon: IconWallet },
  ];
  const media = isMediaWorld(pathname, locale);
  const items = media
    ? [
        { key: "hub", href: `/${locale}${mediaRoutes.hub}`, label: t.mediaNav.hub, Icon: IconScreen, active: isMediaActive(pathname, locale, "hub"), main: false },
        { key: "compare", href: `/${locale}${mediaRoutes.compare}`, label: t.mediaNav.compare, Icon: IconCompare, active: isMediaActive(pathname, locale, "compare"), main: false },
        { key: "advisor", href: `/${locale}${mediaRoutes.advisor}`, label: t.mediaNav.advisor, Icon: IconCompass, active: isMediaActive(pathname, locale, "advisor"), main: true },
        { key: "abos", href: `/${locale}${mediaRoutes.abos}`, label: t.mediaNav.abosShort, Icon: IconPlay, active: isMediaActive(pathname, locale, "abos"), main: false },
        { key: "budget", href: `/${locale}${routes.budget}`, label: t.nav.budget, Icon: IconWallet, active: isActive(pathname, locale, "budget"), main: false },
      ]
    : food.map((f) => ({ ...f, href: `/${locale}${routes[f.key]}`, active: isActive(pathname, locale, f.key), main: f.key === "scan" }));
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ key, href, label, Icon, active, main }) => {
          const scan = main;
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold ${
                  active ? "text-pine-strong" : "text-ink-soft"
                }`}
              >
                <span
                  className={
                    scan
                      ? "grid h-10 w-10 place-items-center rounded-full bg-pine text-on-pine"
                      : `grid h-7 w-12 place-items-center rounded-full ${active ? "bg-pine-tint" : ""}`
                  }
                >
                  <Icon width={scan ? 22 : 20} height={scan ? 22 : 20} />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
