// Wiederkehrende Bausteine der Vorlage (Startseite und alle Rubriken): Markentitel, Vorteile-Leiste, Leiste unten.
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries/de";
import type { Locale } from "@/i18n/config";
import {
  IconCalculator, IconCalendar, IconChart, IconLeaf, IconPiggy, IconScale, IconScan, IconScreen, IconWallet, IconPlay,
} from "@/components/ui/icons";

export function BrandTitle({ suffix }: { suffix?: string }) {
  return (
    <span className="relative inline-flex flex-wrap items-baseline gap-x-4 text-[2.8rem] font-extrabold leading-[0.95] tracking-[-0.035em] text-ink sm:text-[3.9rem] lg:text-[4.3rem]">
      <span className="relative">
        Preis-<span className="bg-gradient-to-r from-[#0b8f86] to-[#19b8ad] bg-clip-text text-transparent">Pilot</span>
        <svg aria-hidden="true" viewBox="0 0 300 24" className="absolute -bottom-3 right-0 h-5 w-[58%]" preserveAspectRatio="none">
          <path d="M4 18 C 90 6, 200 4, 296 12" fill="none" stroke="url(#pp-swoosh)" strokeWidth="5" strokeLinecap="round" />
          <defs><linearGradient id="pp-swoosh" x1="0" x2="1"><stop offset="0" stopColor="#0b7d78" stopOpacity="0.3" /><stop offset="1" stopColor="#19b8ad" /></linearGradient></defs>
        </svg>
      </span>
      {suffix && (
        <>
          <span aria-hidden="true" className="font-light text-ink/70">|</span>
          <span className="bg-gradient-to-r from-[#0b8f86] to-[#19b8ad] bg-clip-text text-transparent">{suffix}</span>
        </>
      )}
    </span>
  );
}

/** Vorteile-Leiste: 4 Punkte in den Rubriken, 5 auf der Startseite (mit Multimedia) */
export function FeatureRow({ lang, t, withMedia = false }: { lang: Locale; t: Dictionary; withMedia?: boolean }) {
  const L = t.landing;
  const items = [
    { ...L.features[0], href: `/${lang}/search`, Icon: IconPiggy },
    { ...L.features[1], href: `/${lang}/search`, Icon: IconLeaf },
    { ...L.features[2], href: `/${lang}/budget`, Icon: IconCalculator },
    ...(withMedia ? [{ ...L.featureMedia, href: `/${lang}/r/multimedia-entertainment`, Icon: IconScreen }] : []),
    { ...L.features[3], href: `/${lang}/insights`, Icon: IconChart },
  ];
  return (
    <section aria-label={L.eyebrow.join(", ")} className="border-y border-line bg-[#f5f9f9] dark:bg-paper">
      <ul className={`mx-auto grid max-w-[1560px] grid-cols-1 gap-y-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:px-10 ${withMedia ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {items.map(({ title, text, href, Icon }, i) => (
          <li key={title} className={`lg:px-5 ${i > 0 ? "lg:border-l lg:border-line" : "lg:pl-0"}`}>
            <Link href={href} className="group flex items-center gap-4">
              <Icon width={42} height={42} strokeWidth={1.5} className="shrink-0 text-pine" />
              <span>
                <span className="block text-[1.08rem] font-bold group-hover:text-pine">{title}</span>
                <span className="block text-sm text-ink-soft">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BottomStrip({ lang, t, withMedia = false }: { lang: Locale; t: Dictionary; withMedia?: boolean }) {
  const L = t.landing;
  const links = [`/${lang}/scan`, `/${lang}/search`, `/${lang}/lists`, `/${lang}/budget`, `/${lang}/insights`, withMedia ? `/${lang}/r/multimedia-entertainment` : `/${lang}/search`];
  const icons = [IconScan, IconScale, IconCalendar, IconWallet, IconChart, withMedia ? IconPlay : IconLeaf];
  const items = withMedia ? [...L.strip.slice(0, 5), L.stripMedia] : L.strip;
  return (
    <section aria-label={t.nav.main} className="bg-gradient-to-r from-petrol via-[#0d5560] to-[#0f6f6c] text-white">
      <ul className="mx-auto grid max-w-[1560px] grid-cols-2 gap-y-5 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-10">
        {items.map((s, i) => {
          const Icon = icons[i];
          return (
            <li key={s.title} className={`lg:px-5 ${i > 0 ? "lg:border-l lg:border-white/20" : "lg:pl-0"}`}>
              <Link href={links[i]} className="group flex items-center gap-3">
                <Icon width={38} height={38} strokeWidth={1.5} className="shrink-0 text-white" />
                <span className="min-w-0">
                  <span className="block font-bold group-hover:text-aqua">{s.title}</span>
                  <span className="block text-[0.82rem] text-white/80">{s.text}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
