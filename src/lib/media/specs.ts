// Multimedia-Kategorien mit eigenen Datenblättern. Werte stammen ausschließlich aus Herstellerangaben,
// die der Nutzer mit Quelle erfasst – unbekannte Eigenschaften bleiben leer und werden nie geschätzt.
import type { Locale } from "@/i18n/config";

export type SpecType = "number" | "text" | "bool" | "enum";
export interface SpecDef {
  key: string;
  label: Record<Locale, string>;
  type: SpecType;
  unit?: string;
  /** Richtung für den Vergleich; null = nur informativ */
  better: "higher" | "lower" | null;
  options?: string[];
  /** Merkmal unterscheidet Varianten (z. B. Speicher, Größe, Generation) */
  variant?: boolean;
}

const L = (de: string, it: string, en: string) => ({ de, it, en });

const common: SpecDef[] = [
  { key: "warrantyMonths", label: L("Herstellergarantie", "Garanzia del produttore", "Manufacturer warranty"), type: "number", unit: "Monate", better: "higher" },
  { key: "releaseYear", label: L("Erscheinungsjahr", "Anno di uscita", "Release year"), type: "number", better: "higher" },
];

export const specSchemas: Record<string, SpecDef[]> = {
  tv: [
    { key: "screenInches", label: L("Bilddiagonale", "Diagonale", "Screen size"), type: "number", unit: "Zoll", better: null, variant: true },
    { key: "panel", label: L("Displaytechnik", "Tecnologia pannello", "Panel"), type: "enum", options: ["OLED", "QD-OLED", "Mini-LED", "QLED", "LED"], better: null },
    { key: "resolution", label: L("Auflösung", "Risoluzione", "Resolution"), type: "enum", options: ["8K", "4K", "Full HD", "HD"], better: null },
    { key: "refreshHz", label: L("Bildwiederholrate", "Frequenza di aggiornamento", "Refresh rate"), type: "number", unit: "Hz", better: "higher" },
    { key: "hdr", label: L("HDR-Formate", "Formati HDR", "HDR formats"), type: "text", better: null },
    { key: "hdmiPorts", label: L("HDMI-Anschlüsse", "Porte HDMI", "HDMI ports"), type: "number", better: "higher" },
    { key: "hdmi21", label: L("HDMI 2.1", "HDMI 2.1", "HDMI 2.1"), type: "bool", better: "higher" },
    { key: "os", label: L("Betriebssystem", "Sistema operativo", "Operating system"), type: "text", better: null },
    { key: "energyClassSdr", label: L("Energieklasse (SDR)", "Classe energetica (SDR)", "Energy class (SDR)"), type: "enum", options: ["A", "B", "C", "D", "E", "F", "G"], better: "higher" },
    { key: "powerSdrW", label: L("Leistungsaufnahme SDR", "Consumo SDR", "Power draw SDR"), type: "number", unit: "W", better: "lower" },
    ...common,
  ],
  smartphone: [
    { key: "storageGb", label: L("Speicher", "Memoria", "Storage"), type: "number", unit: "GB", better: "higher", variant: true },
    { key: "ramGb", label: L("Arbeitsspeicher", "RAM", "RAM"), type: "number", unit: "GB", better: "higher", variant: true },
    { key: "displayInches", label: L("Display", "Display", "Display"), type: "number", unit: "Zoll", better: null },
    { key: "refreshHz", label: L("Bildwiederholrate", "Frequenza", "Refresh rate"), type: "number", unit: "Hz", better: "higher" },
    { key: "batteryMah", label: L("Akku", "Batteria", "Battery"), type: "number", unit: "mAh", better: "higher" },
    { key: "mainCameraMp", label: L("Hauptkamera", "Fotocamera principale", "Main camera"), type: "number", unit: "MP", better: "higher" },
    { key: "chip", label: L("Prozessor", "Processore", "Chip"), type: "text", better: null },
    { key: "updateYears", label: L("Zugesagte Updates", "Aggiornamenti garantiti", "Promised updates"), type: "number", unit: "Jahre", better: "higher" },
    { key: "fiveG", label: L("5G", "5G", "5G"), type: "bool", better: "higher" },
    ...common,
  ],
  computer: [
    { key: "cpu", label: L("Prozessor", "Processore", "CPU"), type: "text", better: null, variant: true },
    { key: "ramGb", label: L("Arbeitsspeicher", "RAM", "RAM"), type: "number", unit: "GB", better: "higher", variant: true },
    { key: "storageGb", label: L("SSD", "SSD", "SSD"), type: "number", unit: "GB", better: "higher", variant: true },
    { key: "gpu", label: L("Grafik", "Grafica", "GPU"), type: "text", better: null },
    { key: "displayInches", label: L("Display", "Display", "Display"), type: "number", unit: "Zoll", better: null },
    { key: "weightKg", label: L("Gewicht", "Peso", "Weight"), type: "number", unit: "kg", better: "lower" },
    { key: "batteryHours", label: L("Akkulaufzeit (Hersteller)", "Autonomia (produttore)", "Battery life (maker)"), type: "number", unit: "h", better: "higher" },
    { key: "os", label: L("Betriebssystem", "Sistema operativo", "OS"), type: "text", better: null },
    ...common,
  ],
  gaming: [
    { key: "platform", label: L("Plattform", "Piattaforma", "Platform"), type: "enum", options: ["PC", "PlayStation 5", "PlayStation 4", "Xbox Series", "Nintendo Switch", "Nintendo Switch 2"], better: null, variant: true },
    { key: "edition", label: L("Edition", "Edizione", "Edition"), type: "text", better: null, variant: true },
    { key: "format", label: L("Version", "Versione", "Version"), type: "enum", options: ["digital", "physisch"], better: null, variant: true },
    { key: "region", label: L("Region / Aktivierung", "Regione / attivazione", "Region / activation"), type: "text", better: null, variant: true },
    { key: "licenseType", label: L("Lizenztyp", "Tipo di licenza", "License type"), type: "text", better: null },
    { key: "storageGb", label: L("Speicher (Konsole)", "Memoria (console)", "Storage (console)"), type: "number", unit: "GB", better: "higher", variant: true },
    ...common,
  ],
  photoAudio: [
    { key: "type", label: L("Gerätetyp", "Tipo", "Type"), type: "text", better: null },
    { key: "sensor", label: L("Sensor / Treiber", "Sensore / driver", "Sensor / driver"), type: "text", better: null },
    { key: "resolutionMp", label: L("Auflösung", "Risoluzione", "Resolution"), type: "number", unit: "MP", better: "higher" },
    { key: "video", label: L("Video", "Video", "Video"), type: "text", better: null },
    { key: "batteryHours", label: L("Akkulaufzeit (Hersteller)", "Autonomia (produttore)", "Battery life (maker)"), type: "number", unit: "h", better: "higher" },
    { key: "anc", label: L("Geräuschunterdrückung", "Cancellazione rumore", "Noise cancelling"), type: "bool", better: "higher" },
    { key: "weightG", label: L("Gewicht", "Peso", "Weight"), type: "number", unit: "g", better: "lower" },
    ...common,
  ],
  software: [
    { key: "model", label: L("Kaufmodell", "Modello d'acquisto", "Purchase model"), type: "enum", options: ["Einmalkauf", "Abo monatlich", "Abo jährlich", "Kostenlos"], better: null, variant: true },
    { key: "devices", label: L("Geräte pro Lizenz", "Dispositivi per licenza", "Devices per license"), type: "number", better: "higher", variant: true },
    { key: "systems", label: L("Unterstützte Systeme", "Sistemi supportati", "Supported systems"), type: "text", better: null },
    { key: "termMonths", label: L("Laufzeit", "Durata", "Term"), type: "number", unit: "Monate", better: null },
    { key: "licenseTerms", label: L("Lizenzbedingungen", "Condizioni di licenza", "License terms"), type: "text", better: null },
    ...common,
  ],
};

export interface MediaCategory {
  slug: string;
  schema: keyof typeof specSchemas;
  label: Record<Locale, string>;
  sub: Record<Locale, string>[];
}

export const mediaCategories: MediaCategory[] = [
  { slug: "tv-heimkino", schema: "tv", label: L("Fernseher & Heimkino", "TV e home cinema", "TV & home cinema"),
    sub: [L("OLED/QLED/Mini-LED-TVs", "TV OLED/QLED/Mini-LED", "OLED/QLED/Mini-LED TVs"), L("Beamer", "Proiettori", "Projectors"), L("Soundbars", "Soundbar", "Soundbars"), L("AV-Receiver", "Sintoamplificatori", "AV receivers")] },
  { slug: "smartphones-tablets", schema: "smartphone", label: L("Smartphones & Tablets", "Smartphone e tablet", "Smartphones & tablets"),
    sub: [L("Android", "Android", "Android"), L("iPhone", "iPhone", "iPhone"), L("Tablets", "Tablet", "Tablets"), L("Smartwatches", "Smartwatch", "Smartwatches")] },
  { slug: "computer-hardware", schema: "computer", label: L("Computer & Hardware", "Computer e hardware", "Computers & hardware"),
    sub: [L("Notebooks", "Notebook", "Laptops"), L("Desktop- & Gaming-PCs", "PC desktop e gaming", "Desktop & gaming PCs"), L("Grafikkarten & SSDs", "Schede video e SSD", "GPUs & SSDs"), L("Monitore & Drucker", "Monitor e stampanti", "Monitors & printers")] },
  { slug: "gaming", schema: "gaming", label: L("Gaming", "Gaming", "Gaming"),
    sub: [L("Konsolen", "Console", "Consoles"), L("Spiele (digital/physisch)", "Giochi (digitali/fisici)", "Games (digital/physical)"), L("Zubehör & Headsets", "Accessori e cuffie", "Accessories & headsets"), L("Refurbished", "Ricondizionati", "Refurbished")] },
  { slug: "foto-video-audio", schema: "photoAudio", label: L("Foto, Video & Audio", "Foto, video e audio", "Photo, video & audio"),
    sub: [L("Kameras & Objektive", "Fotocamere e obiettivi", "Cameras & lenses"), L("Actioncams & Drohnen", "Action cam e droni", "Action cams & drones"), L("Kopfhörer & Lautsprecher", "Cuffie e altoparlanti", "Headphones & speakers"), L("Mikrofone & Studio", "Microfoni e studio", "Microphones & studio")] },
  { slug: "software", schema: "software", label: L("Software & Digitales", "Software e digitale", "Software & digital"),
    sub: [L("Office & Produktivität", "Office e produttività", "Office & productivity"), L("Grafik & Video", "Grafica e video", "Graphics & video"), L("Sicherheit", "Sicurezza", "Security"), L("Lernprodukte", "Formazione", "Learning")] },
];

export function findMediaCategory(slug: string): MediaCategory | undefined {
  return mediaCategories.find((c) => c.slug === slug);
}
