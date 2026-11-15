// Die neun Rubriken (Vorlage: Uwes Designbogen). Lebensmittel-Kategorien rechnen mit belegten Open-Prices-Preisen,
// Produkt-Kategorien mit selbst erfassten, datierten Händlerangeboten (Best-Price-Engine).
import type { Locale } from "@/i18n/config";

type L3 = Record<Locale, string>;
const L = (de: string, it: string, en: string): L3 => ({ de, it, en });

export interface Rubric {
  slug: string;
  label: L3;
  text: L3;
  food: string[];
  products: string[];
}

export const rubrics: Rubric[] = [
  { slug: "lebensmittel", label: L("Lebensmittel", "Alimentari", "Groceries"),
    text: L("Preise vergleichen, Angebote entdecken und clever sparen.", "Confronta i prezzi, scopri le offerte e risparmia.", "Compare prices, find offers and save smartly."),
    food: ["lebensmittel", "obst-gemuese", "milchprodukte", "brot-backwaren", "fleisch-wurst", "nudeln-reis", "fruehstueck", "snacks-suesses", "kaffee-tee", "getraenke", "tierbedarf"], products: [] },
  { slug: "elektronik-technik", label: L("Elektronik & Technik", "Elettronica e tecnologia", "Electronics & tech"),
    text: L("Smartphones, PCs, TV, Audio, Gaming und mehr – immer zum besten Preis.", "Smartphone, PC, TV, audio, gaming e altro – sempre al miglior prezzo.", "Smartphones, PCs, TV, audio, gaming and more – always at the best price."),
    food: [], products: ["tv-heimkino", "smartphones-tablets", "computer-hardware", "foto-video-audio"] },
  { slug: "haushalt-wohnen", label: L("Haushalt & Wohnen", "Casa e arredamento", "Home & living"),
    text: L("Haushaltsgeräte, Reinigung, Küche, Möbel und Wohnen im Preisvergleich.", "Elettrodomestici, pulizia, cucina, mobili e casa a confronto.", "Appliances, cleaning, kitchen, furniture and living compared."),
    food: ["haushalt"], products: ["haushaltsgeraete", "wohnen"] },
  { slug: "drogerie-gesundheit", label: L("Drogerie & Gesundheit", "Drogheria e salute", "Drugstore & health"),
    text: L("Pflege, Hygiene, Kosmetik, Gesundheit und Wellness – clever vergleichen.", "Cura, igiene, cosmetica, salute e benessere – confronta con intelligenza.", "Care, hygiene, cosmetics, health and wellness – compare smartly."),
    food: ["drogerie"], products: ["pflege-gesundheit"] },
  { slug: "baby-kind", label: L("Baby & Kind", "Neonati e bambini", "Baby & kids"),
    text: L("Alles für dein Kind – von Babypflege über Spielzeug bis Kindermode.", "Tutto per il tuo bambino – dalla cura al gioco.", "Everything for your child – from baby care to toys."),
    food: ["baby-kind"], products: ["baby-ausstattung", "spielzeug"] },
  { slug: "sport-freizeit", label: L("Sport & Freizeit", "Sport e tempo libero", "Sport & leisure"),
    text: L("Sportartikel, Outdoor, Fitness, Camping und Freizeit – immer zum besten Preis.", "Articoli sportivi, outdoor, fitness e campeggio – sempre al miglior prezzo.", "Sports gear, outdoor, fitness and camping – always at the best price."),
    food: [], products: ["fitness", "outdoor-camping", "fahrrad"] },
  { slug: "garten-heimwerken", label: L("Garten & Heimwerken", "Giardino e fai da te", "Garden & DIY"),
    text: L("Gartengeräte, Pflanzen, Werkzeuge und DIY-Projekte – Preise vergleichen und sparen.", "Attrezzi, piante, utensili e progetti fai da te – confronta e risparmia.", "Garden tools, plants, tools and DIY – compare and save."),
    food: [], products: ["werkzeug", "gartengeraete", "garten-pflanzen"] },
  { slug: "auto-motorrad", label: L("Auto & Motorrad", "Auto e moto", "Car & motorcycle"),
    text: L("Ersatzteile, Reifen, Öl, Pflege und Zubehör – Markenprodukte zum besten Preis.", "Ricambi, pneumatici, olio, cura e accessori – al miglior prezzo.", "Spare parts, tyres, oil, care and accessories – at the best price."),
    food: [], products: ["reifen", "auto-zubehoer", "motorrad"] },
  { slug: "multimedia-entertainment", label: L("Multimedia & Entertainment", "Multimedia e intrattenimento", "Multimedia & entertainment"),
    text: L("Filme, Musik, Games, Software, Streaming und kreative Produkte – alles im Preisvergleich.", "Film, musica, giochi, software, streaming e prodotti creativi – tutto a confronto.", "Films, music, games, software, streaming and creative products – all compared."),
    food: [], products: ["gaming", "software", "video-audio", "design-kreativ", "vorlagen-pakete", "3d-modelle"] },
];

export function findRubric(slug: string): Rubric | undefined {
  return rubrics.find((r) => r.slug === slug);
}

/** Zu welcher Rubrik gehört eine Kategorie (Lebensmittel- oder Produkt-Kategorie)? */
export function rubricOf(categorySlug: string, kind: "food" | "products"): Rubric | undefined {
  return rubrics.find((r) => r[kind].includes(categorySlug));
}
