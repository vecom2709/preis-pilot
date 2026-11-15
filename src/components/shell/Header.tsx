"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import {
  IconCalendar, IconCart, IconChart, IconClose, IconCompare, IconCompass, IconHome, IconList, IconMenu, IconPlay, IconRadar,
  IconScale, IconScreen, IconSearch, IconTag, IconUser,
} from "@/components/ui/icons";
import { Logo } from "./Logo";
import {
  headerNav, isActive, isMediaActive, isMediaWorld, mainNav, mediaNav, mediaRoutes, navLabel, routes, type MediaNavKey, type NavKey,
} from "./nav";
import { SettingsPanel } from "./SettingsPanel";

const navIcons: Partial<Record<NavKey, typeof IconHome>> = {
  home: IconHome, search: IconScale, offers: IconTag, lists: IconList, budget: IconCalendar, insights: IconChart, radar: IconRadar,
};
const mediaIcons: Record<MediaNavKey, typeof IconHome> = { hub: IconScreen, compare: IconCompare, advisor: IconCompass, abos: IconPlay };

interface NavEntry { id: string; href: string; label: string; active: boolean; Icon: typeof IconHome }

/** Navigation passend zur gewählten Welt (Lebensmittel oder Multimedia) */
function useEntries(pathname: string): { media: boolean; entries: NavEntry[]; all: NavEntry[] } {
  const { locale, t } = useI18n();
  const media = isMediaWorld(pathname, locale);
  const food = (keys: NavKey[]) =>
    keys.map((key) => ({ id: key, href: `/${locale}${routes[key]}`, label: navLabel(key, t), active: isActive(pathname, locale, key), Icon: navIcons[key] ?? IconUser }));
  const mediaEntries = mediaNav.map((key) => ({
    id: key, href: `/${locale}${mediaRoutes[key]}`, label: t.mediaNav[key], active: isMediaActive(pathname, locale, key), Icon: mediaIcons[key],
  }));
  if (media) {
    const extra = food(["budget", "radar"]);
    return { media, entries: [...mediaEntries, ...extra], all: [...mediaEntries, ...extra, ...food(["account"])] };
  }
  return { media, entries: food(headerNav), all: food(mainNav) };
}

/** Umschalter zwischen den beiden Welten – auf allen Bildschirmgrößen sichtbar */
function WorldSwitch({ media }: { media: boolean }) {
  const { locale, t } = useI18n();
  const items = [
    { href: `/${locale}`, label: t.world.food, Icon: IconCart, active: !media },
    { href: `/${locale}/media`, label: t.world.media, Icon: IconScreen, active: media },
  ];
  return (
    <nav aria-label={t.world.label} className="border-t border-white/10 bg-black/20">
      <ul className="mx-auto flex h-10 max-w-[1560px] items-stretch gap-1 px-4 sm:px-6 lg:px-10">
        {items.map(({ href, label, Icon, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-10 items-center gap-2 px-3 text-sm font-semibold transition-colors ${
                active ? "text-white" : "text-white/70 hover:text-white"
              }`}
            >
              <Icon width={17} height={17} />
              {label}
              {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-aqua" />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Header() {
  return <HeaderView pathname={usePathname()} />;
}

/** Ohne aktiven Pfad nutzbar – dient als statischer Platzhalter beim Vorab-Rendern */
export function HeaderView({ pathname }: { pathname: string }) {
  const { locale, t } = useI18n();
  const { media, entries, all } = useEntries(pathname);
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
                    className={`relative flex h-[74px] items-center gap-2 whitespace-nowrap px-3 text-[0.98rem] font-semibold transition-colors ${
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
            className="hidden items-center gap-2.5 whitespace-nowrap rounded-full border border-white/50 px-5 py-2.5 text-[1rem] font-semibold text-white transition-colors hover:border-aqua hover:text-aqua sm:inline-flex"
          >
            <IconUser width={21} height={21} />
            {t.nav.account}
          </Link>
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
      <WorldSwitch media={media} />

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
            <div className="mt-6 border-t border-line px-3 pt-5">
              <SettingsPanel />
            </div>
          </nav>
        </div>
      </dialog>
    </header>
  );
}
