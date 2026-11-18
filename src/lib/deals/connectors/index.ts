// Register aller Datenquellen. Neue Händler: Connector schreiben und hier eintragen – oder als Feed über FEEDS_JSON.
import { ebay } from "./ebay";
import { feedConfigs, feedConnector } from "./feed";
import { gog } from "./gog";
import { itad } from "./itad";
import { openPrices } from "./open-prices";
import { steam } from "./steam";
import type { Connector } from "./types";

export const builtinConnectors: Connector[] = [openPrices, gog, steam, itad, ebay];

export function allConnectors(env: Record<string, string | undefined> = process.env): Connector[] {
  return [...builtinConnectors, ...feedConfigs(env).map(feedConnector)];
}

/** Quellen, für die noch Zugangsdaten fehlen oder die erst freigeschaltet werden müssen (für Admin und Bericht) */
export const pendingSources = [
  { key: "itad", label: "IsThereAnyDeal", need: "ITAD_API_KEY (kostenlos)", url: "https://isthereanydeal.com/apps/my/" },
  { key: "ebay", label: "eBay Browse API", need: "EBAY_CLIENT_ID, EBAY_CLIENT_SECRET (kostenloses Entwicklerkonto), optional EBAY_CAMPAIGN_ID", url: "https://developer.ebay.com/my/keys" },
  { key: "awin", label: "Awin-Produktfeeds (Otto, MediaMarkt, Saturn, Douglas, … je nach Freigabe)", need: "Publisher-Konto + Partnerfreigaben, Feed-URLs in FEEDS_JSON", url: "https://www.awin.com/de/publisher" },
  { key: "amazon", label: "Amazon Product Advertising API", need: "Partnerprogramm-Konto mit qualifizierten Verkäufen", url: "https://partnernet.amazon.de" },
  { key: "idealo", label: "idealo / Geizhals", need: "keine öffentliche Schnittstelle – nur über Partnerschaft", url: "https://partner.idealo.com" },
];

export type { Connector } from "./types";
