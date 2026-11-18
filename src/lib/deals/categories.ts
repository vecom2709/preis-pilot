// Die Angebotskategorien von Preis-Pilot 3.0. Dynamisch erweiterbar: neue Einträge hier oder automatisch
// erkannte Kategorien landen unter „sonstiges“. Jede Kategorie kann einer Design-Rubrik zugeordnet sein.
import type { Locale } from "@/i18n/config";

type L3 = Record<Locale, string>;
const L = (de: string, it: string, en: string): L3 => ({ de, it, en });

export interface DealCategory {
  slug: string;
  label: L3;
  rubric: string | null;
  /** Schlüsselwörter (de/it/en, klein) für die automatische Zuordnung von Feed-Artikeln */
  keywords: string[];
}

export const dealCategories: DealCategory[] = [
  { slug: "lebensmittel-getraenke", label: L("Lebensmittel & Getränke", "Alimentari e bevande", "Food & drinks"), rubric: "lebensmittel", keywords: ["lebensmittel", "getränk", "kaffee", "tee", "schokolade", "alimentar", "bevand", "caffè", "food", "drink", "snack", "wein", "vino", "bier", "birra"] },
  { slug: "supermarkt-discounter", label: L("Supermärkte & Discounter", "Supermercati e discount", "Supermarkets & discounters"), rubric: "lebensmittel", keywords: ["supermarkt", "discounter", "supermercat"] },
  { slug: "drogerie-koerperpflege", label: L("Drogerie & Körperpflege", "Drogheria e cura del corpo", "Drugstore & personal care"), rubric: "drogerie-gesundheit", keywords: ["drogerie", "duschgel", "shampoo", "zahnpasta", "deo", "körperpflege", "igiene", "dentifricio", "doccia", "rasier"] },
  { slug: "haushalt-reinigung", label: L("Haushalt & Reinigung", "Casa e pulizia", "Household & cleaning"), rubric: "haushalt-wohnen", keywords: ["reinigung", "putzmittel", "waschmittel", "spülmittel", "detersiv", "pulizia", "cleaning", "haushalt"] },
  { slug: "kuechengeraete", label: L("Küchengeräte", "Elettrodomestici da cucina", "Kitchen appliances"), rubric: "haushalt-wohnen", keywords: ["kaffeevollautomat", "kaffeemaschine", "mixer", "airfryer", "heißluftfritteuse", "toaster", "wasserkocher", "küchenmaschine", "friggitrice", "macchina caffè", "frullatore"] },
  { slug: "moebel-einrichtung", label: L("Möbel & Einrichtung", "Mobili e arredamento", "Furniture & interior"), rubric: "haushalt-wohnen", keywords: ["möbel", "sofa", "regal", "schrank", "lampe", "teppich", "mobili", "divano", "furniture", "matratze", "materasso"] },
  { slug: "baumarkt-heimwerken", label: L("Baumarkt & Heimwerken", "Fai da te", "DIY & home improvement"), rubric: "garten-heimwerken", keywords: ["baumarkt", "heimwerk", "farbe", "schrauben", "fai da te", "diy"] },
  { slug: "garten-pflanzen", label: L("Garten & Pflanzen", "Giardino e piante", "Garden & plants"), rubric: "garten-heimwerken", keywords: ["garten", "pflanze", "rasen", "grill", "giardino", "piante", "garden", "barbecue"] },
  { slug: "auto-teile-reifen", label: L("Autozubehör, Teile & Reifen", "Auto: accessori, ricambi e pneumatici", "Car parts, accessories & tyres"), rubric: "auto-motorrad", keywords: ["reifen", "auto", "motoröl", "autobatterie", "kfz", "pneumatic", "ricambi auto", "tyre", "tire", "scheibenwischer"] },
  { slug: "motorrad-fahrrad", label: L("Motorrad & Fahrrad", "Moto e bici", "Motorcycle & bike"), rubric: "auto-motorrad", keywords: ["motorrad", "fahrrad", "e-bike", "helm", "moto", "bici", "bicicletta", "bike"] },
  { slug: "multimedia-elektronik", label: L("Multimedia & Unterhaltungselektronik", "Multimedia ed elettronica", "Multimedia & consumer electronics"), rubric: "elektronik-technik", keywords: ["elektronik", "kamera", "drohne", "elettronica", "electronics", "speicherkarte", "powerbank"] },
  { slug: "tv-audio-heimkino", label: L("Fernseher, Audio & Heimkino", "TV, audio e home cinema", "TV, audio & home cinema"), rubric: "elektronik-technik", keywords: ["fernseher", "tv", "soundbar", "kopfhörer", "lautsprecher", "beamer", "televisor", "cuffie", "headphones", "speaker", "oled", "qled"] },
  { slug: "smartphones-tablets", label: L("Smartphones & Tablets", "Smartphone e tablet", "Smartphones & tablets"), rubric: "elektronik-technik", keywords: ["smartphone", "handy", "tablet", "iphone", "galaxy", "ipad", "cellulare"] },
  { slug: "computer-notebooks", label: L("Computer, Notebooks & Zubehör", "Computer, notebook e accessori", "Computers, laptops & accessories"), rubric: "elektronik-technik", keywords: ["notebook", "laptop", "computer", "monitor", "ssd", "grafikkarte", "tastatur", "maus", "drucker", "router", "portatile"] },
  { slug: "gaming-konsolen", label: L("Gaming & Konsolen", "Gaming e console", "Gaming & consoles"), rubric: "multimedia-entertainment", keywords: ["gaming", "konsole", "playstation", "xbox", "nintendo", "spiel", "game", "console", "videogioco"] },
  { slug: "haushaltsgrossgeraete", label: L("Haushaltsgroßgeräte", "Grandi elettrodomestici", "Large appliances"), rubric: "haushalt-wohnen", keywords: ["waschmaschine", "trockner", "kühlschrank", "geschirrspüler", "backofen", "lavatrice", "frigorifero", "lavastoviglie", "dishwasher", "fridge"] },
  { slug: "mode-schuhe", label: L("Mode, Bekleidung & Schuhe", "Moda, abbigliamento e scarpe", "Fashion, clothing & shoes"), rubric: null, keywords: ["mode", "jacke", "hose", "shirt", "schuh", "sneaker", "kleid", "moda", "scarpe", "giacca", "fashion", "shoes"] },
  { slug: "schmuck-accessoires", label: L("Schmuck & Accessoires", "Gioielli e accessori", "Jewellery & accessories"), rubric: null, keywords: ["schmuck", "uhr", "kette", "ring", "tasche", "gioiell", "orologio", "borsa", "jewel", "watch"] },
  { slug: "beauty-kosmetik", label: L("Beauty & Kosmetik", "Bellezza e cosmetica", "Beauty & cosmetics"), rubric: "drogerie-gesundheit", keywords: ["kosmetik", "parfum", "make-up", "creme", "beauty", "cosmetic", "profumo", "trucco"] },
  { slug: "gesundheit-wellness", label: L("Gesundheit & Wellness", "Salute e benessere", "Health & wellness"), rubric: "drogerie-gesundheit", keywords: ["gesundheit", "vitamin", "nahrungsergänzung", "blutdruck", "massage", "salute", "integratore", "health", "wellness"] },
  { slug: "sport-fitness", label: L("Sport & Fitness", "Sport e fitness", "Sport & fitness"), rubric: "sport-freizeit", keywords: ["sport", "fitness", "hantel", "laufschuh", "yoga", "palestra", "running"] },
  { slug: "reisen-freizeit", label: L("Reisen & Freizeit", "Viaggi e tempo libero", "Travel & leisure"), rubric: "sport-freizeit", keywords: ["reise", "koffer", "urlaub", "viaggio", "valigia", "travel", "luggage"] },
  { slug: "baby-kinder", label: L("Baby- & Kinderbedarf", "Neonati e bambini", "Baby & kids"), rubric: "baby-kind", keywords: ["baby", "windel", "kinderwagen", "kindersitz", "pannolin", "passeggino", "neonat", "nappy", "diaper"] },
  { slug: "spielzeug-spiele", label: L("Spielzeug & Spiele", "Giocattoli e giochi", "Toys & games"), rubric: "baby-kind", keywords: ["spielzeug", "lego", "puppe", "brettspiel", "puzzle", "giocattol", "toy", "board game"] },
  { slug: "tierbedarf", label: L("Tierbedarf", "Animali domestici", "Pet supplies"), rubric: "lebensmittel", keywords: ["tier", "hund", "katze", "futter", "cane", "gatto", "pet", "dog", "cat food"] },
  { slug: "buero-schreibwaren", label: L("Büro & Schreibwaren", "Ufficio e cancelleria", "Office & stationery"), rubric: null, keywords: ["büro", "schreibwaren", "papier", "stift", "ordner", "ufficio", "cancelleria", "office", "stationery"] },
  { slug: "werkzeuge-maschinen", label: L("Werkzeuge & Maschinen", "Utensili e macchine", "Tools & machines"), rubric: "garten-heimwerken", keywords: ["werkzeug", "akkuschrauber", "bohrmaschine", "säge", "schleifer", "kompressor", "utensil", "trapano", "tool", "drill"] },
  { slug: "smart-home-sicherheit", label: L("Smart Home & Sicherheit", "Smart home e sicurezza", "Smart home & security"), rubric: "elektronik-technik", keywords: ["smart home", "überwachungskamera", "alarmanlage", "türklingel", "thermostat", "sicurezza", "videosorveglianza", "security camera"] },
  { slug: "outdoor-camping", label: L("Outdoor & Camping", "Outdoor e campeggio", "Outdoor & camping"), rubric: "sport-freizeit", keywords: ["outdoor", "camping", "zelt", "schlafsack", "wander", "campeggio", "tenda", "hiking"] },
  { slug: "saisonartikel", label: L("Saisonartikel", "Articoli stagionali", "Seasonal items"), rubric: null, keywords: ["weihnacht", "advent", "ostern", "halloween", "natale", "pasqua", "christmas", "easter"] },
  { slug: "digitale-produkte-software", label: L("Digitale Produkte & Software", "Prodotti digitali e software", "Digital products & software"), rubric: "multimedia-entertainment", keywords: ["software", "lizenz", "antivirus", "office 365", "vpn", "e-book", "licenza", "licence", "license"] },
  { slug: "sonstiges", label: L("Weitere Kategorien", "Altre categorie", "More categories"), rubric: null, keywords: [] },
];

export function findDealCategory(slug: string): DealCategory | undefined {
  return dealCategories.find((c) => c.slug === slug);
}

/** Automatische Zuordnung aus Händlerkategorie und Titel; ohne Treffer „sonstiges“. */
export function classify(...texts: (string | null | undefined)[]): string {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  let best = { slug: "sonstiges", hits: 0 };
  for (const c of dealCategories) {
    const hits = c.keywords.reduce((n, k) => n + (hay.includes(k) ? k.length : 0), 0);
    if (hits > best.hits) best = { slug: c.slug, hits };
  }
  return best.slug;
}

export function categoriesOfRubric(rubric: string): string[] {
  return dealCategories.filter((c) => c.rubric === rubric).map((c) => c.slug);
}
