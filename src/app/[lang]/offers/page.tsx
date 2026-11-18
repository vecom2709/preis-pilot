import { makePage } from "@/lib/make-page";
import { OffersOverview } from "@/components/deals/OffersOverview";

// Preis-Pilot 3.0: Die Angebotsseite ist die Schnäppchen-Suchmaschine (ersetzt die reine Open-Prices-Liste aus 1.0,
// deren Daten jetzt als Quelle „Open Prices“ in der Suche enthalten sind).
const page = makePage("/offers", (t) => ({ title: t.deals.finder.title, intro: t.deals.finder.intro }), OffersOverview);
export const generateMetadata = page.generateMetadata;
export default page.Page;
