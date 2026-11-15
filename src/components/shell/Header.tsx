"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import {
  IconCalendar, IconChart, IconClose, IconHome, IconList, IconMenu, IconScale, IconSearch, IconTag, IconUser,
} from "@/components/ui/icons";
import { Logo } from "./Logo";
import { headerNav, isActive, mainNav, navLabel, routes, type NavKey } from "./nav";
import { SettingsPanel } from "./SettingsPanel";

const navIcons: Partial<Record<NavKey, typeof IconHome>> = {
  home: IconHome, search: IconScale, offers: IconTag, lists: IconList, budget: IconCalendar, insights: IconChart,
};

export function Header() {
  return <HeaderView pathname={usePathname()} />;
}

/** Ohne aktiven Pfad nutzbar – dient als statischer Platzhalter beim Vorab-Rendern */
export function HeaderView({ pathname }: { pathname: string }) {
  const { locale, t } = useI18n();
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
            {headerNav.map((key) => {
              const active = isActive(pathname, locale, key);
              const Icon = navIcons[key]!;
              return (
                <li key={key}>
                  <Link
                    href={`/${locale}${routes[key]}`}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-[74px] items-center gap-2 whitespace-nowrap px-3 text-[0.98rem] font-semibold transition-colors ${
                      active ? "text-aqua" : "text-white/90 hover:text-white"
                    }`}
                  >
                    <Icon width={20} height={20} />
                    {navLabel(key, t)}
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
              {mainNav.map((key) => {
                const active = isActive(pathname, locale, key);
                return (
                  <li key={key}>
                    <Link
                      href={`/${locale}${routes[key]}`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-3 py-3 text-[1.02rem] font-medium ${active ? "bg-pine-tint text-pine-strong" : "hover:bg-mist"}`}
                    >
                      {navLabel(key, t)}
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
