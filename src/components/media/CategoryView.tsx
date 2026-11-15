"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { fmt } from "@/i18n";
import { findDuplicate, type MediaProduct } from "@/lib/media/engine";
import { findMediaCategory, specSchemas, type SpecDef } from "@/lib/media/specs";
import { uid, updateData, useAppData, useHydrated } from "@/lib/store/local";
import { Notice } from "@/components/ui/Notice";
import { IconPlus } from "@/components/ui/icons";
import { ProductRow, productTitle, unitLabel, useMedia } from "./shared";
import { GameSearch } from "./LiveSearch";

export function CategoryView({ slug }: { slug: string }) {
  const { locale, t } = useMedia();
  const data = useAppData();
  const hydrated = useHydrated();
  const [adding, setAdding] = useState(false);
  const cat = findMediaCategory(slug)!;
  const products = hydrated ? data.products.filter((p) => p.category === slug) : [];

  return (
    <div className="space-y-8">
      <ul className="flex flex-wrap gap-2" aria-label={cat.label[locale]}>
        {cat.sub.map((s) => (
          <li key={s.de} className="chip border border-line py-1 text-ink-soft">{s[locale]}</li>
        ))}
      </ul>

      <section aria-labelledby="list-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="list-title" className="text-lg font-bold">{t.hub.myProducts}</h2>
          <button type="button" className="btn btn-primary btn-sm" aria-expanded={adding} onClick={() => setAdding(!adding)}>
            <IconPlus width={16} height={16} />{t.product.add}
          </button>
        </div>
        {adding && <ProductForm slug={slug} existing={data.products} />}
        {products.length ? (
          <ul className="panel divide-y divide-line overflow-hidden">
            {products.map((p) => <ProductRow key={p.id} product={p} offers={data.offers} />)}
          </ul>
        ) : (
          !adding && <p className="panel p-5 text-ink-soft">{t.hub.noProducts}</p>
        )}
      </section>
      {slug === "gaming" && <GameSearch />}
    </div>
  );
}

function SpecInput({ def, id }: { def: SpecDef; id: string }) {
  const { locale, t } = useMedia();
  const label = def.label[locale] + (def.unit ? ` (${unitLabel(def, t.units)})` : "");
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {def.type === "enum" ? (
        <select id={id} name={`spec:${def.key}`} className="field" defaultValue="">
          <option value="">{t.product.unknown}</option>
          {def.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : def.type === "bool" ? (
        <select id={id} name={`spec:${def.key}`} className="field" defaultValue="">
          <option value="">{t.product.unknown}</option>
          <option value="true">{t.product.yes}</option>
          <option value="false">{t.product.no}</option>
        </select>
      ) : (
        <input
          id={id}
          name={`spec:${def.key}`}
          className="field"
          type={def.type === "number" ? "number" : "text"}
          step="any"
          min={def.type === "number" ? 0 : undefined}
          inputMode={def.type === "number" ? "decimal" : undefined}
          maxLength={def.type === "text" ? 80 : undefined}
        />
      )}
    </div>
  );
}

/** Formular nach Datenblatt der Kategorie – leere Felder bleiben „nicht angegeben“ und werden nie geschätzt. */
export function ProductForm({ slug, existing }: { slug: string; existing: readonly MediaProduct[] }) {
  const { locale, t } = useMedia();
  const router = useRouter();
  const cat = findMediaCategory(slug)!;
  const defs = specSchemas[cat.schema] ?? [];
  const [dup, setDup] = useState<MediaProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const specs: MediaProduct["specs"] = {};
    for (const def of defs) {
      const raw = String(f.get(`spec:${def.key}`) ?? "").trim();
      if (!raw) continue;
      if (def.type === "number") {
        const n = Number(raw.replace(",", "."));
        if (Number.isFinite(n)) specs[def.key] = n;
      } else if (def.type === "bool") specs[def.key] = raw === "true";
      else specs[def.key] = raw;
    }
    const source = String(f.get("specSource") ?? "").trim();
    const product: MediaProduct = {
      id: uid(),
      category: slug,
      schema: cat.schema,
      brand: String(f.get("brand") ?? "").trim(),
      name: String(f.get("name") ?? "").trim(),
      model: String(f.get("model") ?? "").trim(),
      specs,
      specSource: source || null,
      imageUrl: null,
      wishlist: false,
      createdAt: new Date().toISOString(),
    };
    const twin = findDuplicate(product, existing);
    if (twin) {
      setDup(twin);
      return;
    }
    const res = updateData((d) => ({ ...d, products: [...d.products, product] }));
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/${locale}/produkte/product?id=${encodeURIComponent(product.id)}`);
  }

  return (
    <form onSubmit={submit} className="panel space-y-5 p-4 sm:p-5" onChange={() => { setDup(null); setError(null); }}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="pf-brand">{t.product.brand}</label>
          <input id="pf-brand" name="brand" className="field" required maxLength={60} autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="pf-name">{t.product.name}</label>
          <input id="pf-name" name="name" className="field" required maxLength={120} autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="pf-model">{t.product.model}</label>
          <input id="pf-model" name="model" className="field num" maxLength={60} autoComplete="off" aria-describedby="pf-model-hint" />
        </div>
      </div>
      <p id="pf-model-hint" className="-mt-2 text-sm text-ink-soft">{t.product.modelHint}</p>

      <fieldset>
        <legend className="mb-3 font-bold">{t.product.specs}</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {defs.map((def) => <SpecInput key={def.key} def={def} id={`pf-${def.key}`} />)}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="pf-source">{t.product.specSource}</label>
        <input id="pf-source" name="specSource" className="field" type="url" maxLength={500} placeholder="https://" />
      </div>

      {dup && (
        <Notice tone="warn" action={<Link className="btn btn-quiet btn-sm" href={`/${locale}/produkte/product?id=${encodeURIComponent(dup.id)}`}>{t.product.open}</Link>}>
          {fmt(t.product.duplicate, { name: productTitle(dup) })}
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      <button type="submit" className="btn btn-primary">{t.product.save}</button>
    </form>
  );
}
