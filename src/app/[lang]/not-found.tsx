"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";

export default function NotFound() {
  const { t, locale } = useI18n();
  return (
    <div className="py-16">
      <h1 className="display text-[2.2rem]">{t.notFound.title}</h1>
      <p className="mt-2 text-ink-soft">{t.notFound.text}</p>
      <Link href={`/${locale}`} className="btn btn-primary mt-6">{t.notFound.back}</Link>
    </div>
  );
}
