"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { IconChevron, IconSearch } from "@/components/ui/icons";

export function HeroSearch({ home = false }: { home?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim().length >= 2 ? `/${locale}/search?q=${encodeURIComponent(q.trim())}` : `/${locale}/search`);
      }}
      className={`flex w-full ${home ? "max-w-[660px]" : "max-w-[600px]"} items-center rounded-full border border-line bg-paper p-1.5 pl-5 shadow-[0_8px_24px_-12px_rgba(11,58,69,0.35)]`}
    >
      <IconSearch width={24} height={24} className="shrink-0 text-ink" />
      <label htmlFor="hero-q" className="sr-only">{home ? t.landing.homePlaceholder : t.landing.searchPlaceholder}</label>
      <input
        id="hero-q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={home ? t.landing.homePlaceholder : t.landing.searchPlaceholder}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[1rem] text-ink outline-none placeholder:text-ink-soft"
      />
      <button type="submit" className="btn btn-primary !min-h-[50px] shrink-0 !px-5 !text-[1.05rem] sm:!px-7">
        <span className="hidden sm:inline">{home ? t.landing.homeButton : t.landing.searchButton}</span>
        <span className="sm:hidden">{t.search.submit}</span>
        <IconChevron width={20} height={20} />
      </button>
    </form>
  );
}
