"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import {
  IconCalendar, IconChart, IconClose, IconCompare, IconCompass, IconHome, IconList, IconMenu, IconPlay, IconRadar,
  IconScale, IconSearch, IconTag, IconUser,
} from "@/components/ui/icons";
import { findRubric, rubricOf, rubrics } from "@/lib/rubrics";
import { Logo } from "./Logo";
import { SettingsPanel } from "./SettingsPanel";
import { CartButton } from "@/components/cart/Cart";
import { AlertBell } from "@/components/deals/DealAlerts";
import { headerNav, isActive, mainNav, navLabel, routes, type NavKey } from "./nav";
import { rubricIcons } from "./rubric-icons";

const navIcons: Partial<Record<NavKey, typeof IconHome>> = {
  home: IconHome, search: IconScale, offers: IconTag, lists: IconList, budget: IconCalendar, insights: IconChart, radar: IconRadar,
};

/** Aktive Rubrik aus dem Pfad: Rubrikseite, Lebensmittel-Kategorie oder Produkt-Kategorie */
function activeRubric(pathname: string, locale: string): string | null {
  const rest = pathname.slice(locale.length + 1);
  const m = rest.match(/^\/(r|category|produkte\/c)\/([^/?#]+)/);
  if (!m) return null;
  if (m[1] === "r") return findRubric(m[2])?.slug ?? null;
  return rubricOf(m[2], m[1] === "category" ? "food" : "products")?.slug ?? null;
}

/** Rubriken-Leiste: wechselt zwischen allen neun Rubriken, rechts der Einkaufswagen */
function RubricBar({ pathname }: { pathname: string }) {
  const { locale, t } = useI18n();
  const active = activeRubric(pathname, locale);
  return (
    <div className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex h-12 max-w-[1560px] items-center pl-1 sm:pl-3 lg:pl-7 lg:pr-7">
        <nav aria-label={t.rubrics.nav} className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] max-2xl:[mask-image:linear-gradient(to_right,black_88%,transparent)] [&::-webkit-scrollbar]:hidden">
          <ul className="flex h-12 min-w-max items-stretch 2xl:w-full 2xl:justify-between">
            {rubrics.map((r) => {
              const Icon = rubricIcons[r.slug];
              const on = r.slug === active;
              return (
                <li key={r.slug}>
                  <Link
                    href={`/${locale}/r/${r.slug}`}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex h-12 items-center gap-1.5 whitespace-nowrap px-2.5 text-[0.9rem] font-semibold transition-colors ${on ? "text-aqua" : "text-white/80 hover:text-white"}`}
                  >
                    <Icon width={17} height={17} />
                    {r.label[locale]}
                    {on && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-aqua" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function Header() {
  return <HeaderView pathname={usePathname()} />;
}

/** Ohne aktiven Pfad nutzbar – dient als statischer Platzhalter beim Vorab-Rendern */
export function HeaderView({ pathname }: { pathname: string }) {
  const { locale, t } = useI18n();
  const entries = headerNav.map((key) => ({ id: key, href: `/${locale}${routes[key]}`, label: navLabel(key, t), active: isActive(pathname, locale, key), Icon: navIcons[key] ?? IconUser }));
  const all = mainNav.map((key) => ({ id: key, href: `/${locale}${routes[key]}`, label: navLabel(key, t), active: isActive(pathname, locale, key) }));
  const tools = [
    { id: "compare", href: `/${locale}/produkte/compare`, label: t.mediaNav.compare, Icon: IconCompare },
    { id: "advisor", href: `/${locale}/produkte/advisor`, label: t.mediaNav.advisor, Icon: IconCompass },
    { id: "abos", href: `/${locale}/produkte/abos`, label: t.mediaNav.abos, Icon: IconPlay },
  ];
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-petrol to-petrol-2 text-white shadow-[0_1px_0_rgba(255,255,255,0.06)]">
      <div className="mx-auto flex h-[74px] max-w-[1560px] items-center gap-5 px-4 sm:px-6 lg:px-10">
        <Link href={`/${locale}`} className="shrink-0">
          <Logo onDark tagline={t.meta.headerTagline} />
        </Link>
        <span aria-hidden="true" className="ml-4 hidden h-10 w-px bg-white/20 xl:block" />
        <nav aria-label={t.nav.main} className="hidden flex-1 xl:block">
          <ul className="flex items-stretch gap-1">
            {entries.map(({ id, href, label, active, Icon }) => {
              return (
                <li key={id}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-[74px] items-center gap-2 whitespace-nowrap px-2.5 text-[0.98rem] font-semibold 2xl:px-3 transition-colors ${
                      active ? "text-aqua" : "text-white/90 hover:text-white"
                    }`}
                  >
                    <Icon width={20} height={20} />
                    {label}
                    {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-3 h-[3px] rounded-full bg-aqua" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href={`/${locale}/account`}
            className="hidden items-center gap-2.5 whitespace-nowrap rounded-full border border-white/50 px-5 py-2.5 xl:max-2xl:px-3 text-[1rem] font-semibold text-white transition-colors hover:border-aqua hover:text-aqua sm:inline-flex"
          >
            <IconUser width={21} height={21} />
            <span className="xl:max-2xl:sr-only">{t.nav.account}</span>
          </Link>
          <AlertBell />
          <CartButton />
          <Link href={`/${locale}/search`} aria-label={t.nav.searchLabel} className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10">
            <IconSearch width={24} height={24} />
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10 xl:hidden"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={t.nav.more}
            onClick={() => setOpen(true)}
          >
            <IconMenu width={24} height={24} />
          </button>
        </div>
      </div>
      <RubricBar pathname={pathname} />

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && setOpen(false)}
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(24rem,100vw)] max-w-none bg-paper p-0 text-ink backdrop:bg-black/40"
        aria-label={t.nav.more}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[74px] items-center justify-between bg-petrol px-5">
            <Logo onDark />
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10" onClick={() => setOpen(false)} aria-label={t.common.close}>
              <IconClose width={20} height={20} />
            </button>
          </div>
          <nav aria-label={t.nav.main} className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-0.5">
              {all.map(({ id, href, label, active }) => {
                return (
                  <li key={id}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-3 py-3 text-[1.02rem] font-medium ${active ? "bg-pine-tint text-pine-strong" : "hover:bg-mist"}`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <h2 className="mt-5 px-3 text-sm font-semibold text-ink-soft">{t.rubrics.nav}</h2>
            <ul className="mt-1 grid grid-cols-1 gap-0.5">
              {rubrics.map((r) => {
                const Icon = rubricIcons[r.slug];
                return (
                  <li key={r.slug}>
                    <Link href={`/${locale}/r/${r.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-mist">
                      <Icon width={20} height={20} className="text-pine" />{r.label[locale]}
                    </Link>
                  </li>
                );
              })}
              {tools.map(({ id, href, label, Icon }) => (
                <li key={id}>
                  <Link href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-mist">
                    <Icon width={20} height={20} className="text-pine" />{label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-line px-3 pt-5">
              <SettingsPanel />
            </div>
          </nav>
        </div>
      </dialog>
    </header>
  );
}
