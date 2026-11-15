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
  appliance: [
    { key: "variantName", label: L("Ausführung / Farbe", "Versione / colore", "Version / colour"), type: "text", better: null, variant: true },
    { key: "energyClass", label: L("Energieeffizienzklasse", "Classe energetica", "Energy class"), type: "enum", options: ["A", "B", "C", "D", "E", "F", "G"], better: "higher" },
    { key: "powerW", label: L("Leistung", "Potenza", "Power"), type: "number", unit: "W", better: null },
    { key: "capacity", label: L("Fassungsvermögen", "Capacità", "Capacity"), type: "text", better: null },
    { key: "noiseDb", label: L("Lautstärke", "Rumorosità", "Noise"), type: "number", unit: "dB", better: "lower" },
    { key: "dimensions", label: L("Maße (B × H × T)", "Dimensioni (L × A × P)", "Dimensions (W × H × D)"), type: "text", better: null },
    ...common,
  ],
  general: [
    { key: "variantName", label: L("Größe / Farbe / Ausführung", "Taglia / colore / versione", "Size / colour / version"), type: "text", better: null, variant: true },
    { key: "material", label: L("Material", "Materiale", "Material"), type: "text", better: null },
    { key: "weightKg", label: L("Gewicht", "Peso", "Weight"), type: "number", unit: "kg", better: null },
    { key: "dimensions", label: L("Maße", "Dimensioni", "Dimensions"), type: "text", better: null },
    { key: "contents", label: L("Inhalt / Lieferumfang", "Contenuto / dotazione", "Contents"), type: "text", better: null },
    ...common,
  ],
  tool: [
    { key: "voltage", label: L("Spannung", "Tensione", "Voltage"), type: "number", unit: "V", better: null, variant: true },
    { key: "batteryAh", label: L("Akkukapazität", "Capacità batteria", "Battery capacity"), type: "number", unit: "Ah", better: "higher" },
    { key: "batteryIncluded", label: L("Akku und Ladegerät enthalten", "Batteria e caricatore inclusi", "Battery and charger included"), type: "bool", better: "higher", variant: true },
    { key: "powerW", label: L("Leistung", "Potenza", "Power"), type: "number", unit: "W", better: "higher" },
    { key: "weightKg", label: L("Gewicht", "Peso", "Weight"), type: "number", unit: "kg", better: "lower" },
    ...common,
  ],
  bike: [
    { key: "frameSize", label: L("Rahmengröße", "Misura telaio", "Frame size"), type: "text", better: null, variant: true },
    { key: "bikeType", label: L("Typ", "Tipo", "Type"), type: "enum", options: ["Trekking", "City", "Mountainbike", "Rennrad", "Gravel", "Kinder", "Lasten"], better: null },
    { key: "motor", label: L("Motor (E-Bike)", "Motore (e-bike)", "Motor (e-bike)"), type: "text", better: null },
    { key: "batteryWh", label: L("Akku (E-Bike)", "Batteria (e-bike)", "Battery (e-bike)"), type: "number", unit: "Wh", better: "higher" },
    { key: "gears", label: L("Gänge", "Marce", "Gears"), type: "number", better: null },
    { key: "weightKg", label: L("Gewicht", "Peso", "Weight"), type: "number", unit: "kg", better: "lower" },
    ...common,
  ],
  tire: [
    { key: "size", label: L("Reifengröße (z. B. 205/55 R16)", "Misura (es. 205/55 R16)", "Size (e.g. 205/55 R16)"), type: "text", better: null, variant: true },
    { key: "season", label: L("Saison", "Stagione", "Season"), type: "enum", options: ["Sommer", "Winter", "Ganzjahr"], better: null, variant: true },
    { key: "loadSpeed", label: L("Last- / Geschwindigkeitsindex", "Indice di carico / velocità", "Load / speed index"), type: "text", better: null, variant: true },
    { key: "fuelClass", label: L("EU-Label Rollwiderstand", "Etichetta UE resistenza", "EU label rolling resistance"), type: "enum", options: ["A", "B", "C", "D", "E"], better: "higher" },
    { key: "wetClass", label: L("EU-Label Nasshaftung", "Etichetta UE aderenza bagnato", "EU label wet grip"), type: "enum", options: ["A", "B", "C", "D", "E"], better: "higher" },
    { key: "noiseDb", label: L("Abrollgeräusch", "Rumorosità", "Rolling noise"), type: "number", unit: "dB", better: "lower" },
  ],
  carcare: [
    { key: "spec", label: L("Spezifikation (z. B. 5W-30, 12 V 70 Ah)", "Specifica (es. 5W-30, 12 V 70 Ah)", "Spec (e.g. 5W-30, 12 V 70 Ah)"), type: "text", better: null, variant: true },
    { key: "amount", label: L("Menge / Größe", "Quantità / misura", "Amount / size"), type: "text", better: null, variant: true },
    { key: "approvals", label: L("Freigaben / passend für", "Omologazioni / adatto a", "Approvals / fits"), type: "text", better: null },
    ...common,
  ],
  // Digitale Inhalte: Musik/Sounds, Grafiken, Vorlagen, 3D-Assets – Lizenz und Format sind entscheidend
  digital: [
    { key: "license", label: L("Lizenz", "Licenza", "License"), type: "enum", options: ["Privat", "Kommerziell", "Erweitert", "Open Source / CC", "Abo-Bibliothek"], better: null, variant: true },
    { key: "version", label: L("Version / Paket", "Versione / pacchetto", "Version / bundle"), type: "text", better: null, variant: true },
    { key: "formats", label: L("Dateiformate", "Formati file", "File formats"), type: "text", better: null },
    { key: "compatibility", label: L("Kompatibel mit", "Compatibile con", "Compatible with"), type: "text", better: null },
    { key: "itemCount", label: L("Anzahl Dateien / Assets", "Numero di file / asset", "Number of files / assets"), type: "number", better: "higher" },
    { key: "quality", label: L("Qualität (z. B. 4K, 24 Bit, PBR)", "Qualità (es. 4K, 24 bit, PBR)", "Quality (e.g. 4K, 24-bit, PBR)"), type: "text", better: null },
    { key: "commercialUse", label: L("Kommerzielle Nutzung erlaubt", "Uso commerciale consentito", "Commercial use allowed"), type: "bool", better: "higher" },
    { key: "updates", label: L("Updates inklusive", "Aggiornamenti inclusi", "Updates included"), type: "bool", better: "higher" },
    { key: "supportMonths", label: L("Support", "Supporto", "Support"), type: "number", unit: "Monate", better: "higher" },
    { key: "delivery", label: L("Bereitstellung", "Consegna", "Delivery"), type: "enum", options: ["Download", "Online / Cloud", "Abo-Bibliothek"], better: null },
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
  { slug: "gaming", schema: "gaming", label: L("Games & Gaming", "Giochi e gaming", "Games & gaming"),
    sub: [L("Spiele (digital/physisch)", "Giochi (digitali/fisici)", "Games (digital/physical)"), L("Mods & Add-ons", "Mod e add-on", "Mods & add-ons"), L("Konsolen", "Console", "Consoles"), L("Zubehör & Headsets", "Accessori e cuffie", "Accessories & headsets")] },
  { slug: "foto-video-audio", schema: "photoAudio", label: L("Kamera- & Audiotechnik", "Foto e tecnologia audio", "Camera & audio gear"),
    sub: [L("Kameras & Objektive", "Fotocamere e obiettivi", "Cameras & lenses"), L("Actioncams & Drohnen", "Action cam e droni", "Action cams & drones"), L("Kopfhörer & Lautsprecher", "Cuffie e altoparlanti", "Headphones & speakers"), L("Mikrofone & Studio", "Microfoni e studio", "Microphones & studio")] },
  { slug: "software", schema: "software", label: L("Software & Apps", "Software e app", "Software & apps"),
    sub: [L("Tools & Programme", "Strumenti e programmi", "Tools & programs"), L("Lizenzen", "Licenze", "Licences"), L("Office & Produktivität", "Office e produttività", "Office & productivity"), L("Sicherheit", "Sicurezza", "Security")] },
  { slug: "video-audio", schema: "digital", label: L("Video & Audio", "Video e audio", "Video & audio"),
    sub: [L("Musik", "Musica", "Music"), L("Sounds", "Suoni", "Sounds"), L("Effekte", "Effetti", "Effects"), L("Stock-Videos", "Video stock", "Stock footage")] },
  { slug: "design-kreativ", schema: "digital", label: L("Design & Kreativ", "Design e creatività", "Design & creative"),
    sub: [L("Grafiken", "Grafiche", "Graphics"), L("Vorlagen", "Modelli", "Templates"), L("Assets", "Asset", "Assets"), L("Schriften", "Font", "Fonts")] },
  { slug: "vorlagen-pakete", schema: "digital", label: L("Vorlagen & Pakete", "Modelli e pacchetti", "Templates & bundles"),
    sub: [L("Web", "Web", "Web"), L("Business", "Business", "Business"), L("Office", "Office", "Office")] },
  { slug: "3d-modelle", schema: "digital", label: L("3D & Modelle", "3D e modelli", "3D & models"),
    sub: [L("3D-Assets", "Asset 3D", "3D assets"), L("Texturen", "Texture", "Textures"), L("Szenen", "Scene", "Scenes")] },
  { slug: "haushaltsgeraete", schema: "appliance", label: L("Haushaltsgeräte", "Elettrodomestici", "Home appliances"),
    sub: [L("Kaffeevollautomaten", "Macchine da caffè", "Coffee machines"), L("Staubsauger", "Aspirapolvere", "Vacuum cleaners"), L("Waschmaschinen & Trockner", "Lavatrici e asciugatrici", "Washers & dryers"), L("Küchengeräte", "Piccoli elettrodomestici", "Kitchen appliances")] },
  { slug: "wohnen", schema: "general", label: L("Möbel & Wohnen", "Mobili e casa", "Furniture & living"),
    sub: [L("Möbel", "Mobili", "Furniture"), L("Heimtextilien", "Tessili per la casa", "Home textiles"), L("Leuchten & Deko", "Luci e decorazioni", "Lighting & decor")] },
  { slug: "pflege-gesundheit", schema: "general", label: L("Pflege- & Gesundheitsgeräte", "Cura e salute", "Care & health devices"),
    sub: [L("Elektrische Zahnbürsten", "Spazzolini elettrici", "Electric toothbrushes"), L("Rasierer & Haarentfernung", "Rasoi ed epilazione", "Shavers & hair removal"), L("Gesundheitsgeräte", "Dispositivi per la salute", "Health devices")] },
  { slug: "baby-ausstattung", schema: "general", label: L("Baby-Ausstattung", "Prima infanzia", "Baby gear"),
    sub: [L("Kinderwagen", "Passeggini", "Prams"), L("Autositze", "Seggiolini auto", "Car seats"), L("Babyphone", "Baby monitor", "Baby monitors"), L("Windeln & Pflege", "Pannolini e cura", "Nappies & care")] },
  { slug: "spielzeug", schema: "general", label: L("Spielzeug", "Giocattoli", "Toys"),
    sub: [L("Spielzeug", "Giocattoli", "Toys"), L("Lernspiele", "Giochi educativi", "Learning toys"), L("Kinderzimmer", "Cameretta", "Kids' room")] },
  { slug: "fitness", schema: "general", label: L("Fitness", "Fitness", "Fitness"),
    sub: [L("Hanteln & Geräte", "Manubri e attrezzi", "Weights & equipment"), L("Yoga & Matten", "Yoga e tappetini", "Yoga & mats"), L("Sportbekleidung", "Abbigliamento sportivo", "Sportswear")] },
  { slug: "outdoor-camping", schema: "general", label: L("Outdoor & Camping", "Outdoor e campeggio", "Outdoor & camping"),
    sub: [L("Zelte", "Tende", "Tents"), L("Rucksäcke", "Zaini", "Backpacks"), L("Wanderschuhe", "Scarpe da trekking", "Hiking boots")] },
  { slug: "fahrrad", schema: "bike", label: L("Fahrräder & E-Bikes", "Bici ed e-bike", "Bikes & e-bikes"),
    sub: [L("Fahrräder", "Biciclette", "Bikes"), L("E-Bikes", "E-bike", "E-bikes"), L("Zubehör", "Accessori", "Accessories")] },
  { slug: "werkzeug", schema: "tool", label: L("Werkzeug", "Utensili", "Tools"),
    sub: [L("Akku-Werkzeug", "Utensili a batteria", "Cordless tools"), L("Handwerkzeug", "Utensili manuali", "Hand tools"), L("Werkstatt", "Officina", "Workshop")] },
  { slug: "gartengeraete", schema: "tool", label: L("Gartengeräte", "Attrezzi da giardino", "Garden tools"),
    sub: [L("Rasenmäher", "Tosaerba", "Lawn mowers"), L("Heckenscheren", "Tagliasiepi", "Hedge trimmers"), L("Bewässerung", "Irrigazione", "Watering")] },
  { slug: "garten-pflanzen", schema: "general", label: L("Garten & Pflanzen", "Giardino e piante", "Garden & plants"),
    sub: [L("Hochbeete", "Orti rialzati", "Raised beds"), L("Pflanzen & Erde", "Piante e terriccio", "Plants & soil"), L("Gartenmöbel", "Mobili da giardino", "Garden furniture")] },
  { slug: "reifen", schema: "tire", label: L("Reifen", "Pneumatici", "Tyres"),
    sub: [L("Sommerreifen", "Pneumatici estivi", "Summer tyres"), L("Winterreifen", "Pneumatici invernali", "Winter tyres"), L("Ganzjahresreifen", "Quattro stagioni", "All-season tyres")] },
  { slug: "auto-zubehoer", schema: "carcare", label: L("Autozubehör & Pflege", "Accessori e cura auto", "Car accessories & care"),
    sub: [L("Motoröl", "Olio motore", "Engine oil"), L("Batterien", "Batterie", "Batteries"), L("Pflege", "Cura", "Care"), L("Ersatzteile", "Ricambi", "Spare parts")] },
  { slug: "motorrad", schema: "general", label: L("Motorrad", "Moto", "Motorcycle"),
    sub: [L("Helme", "Caschi", "Helmets"), L("Bekleidung", "Abbigliamento", "Clothing"), L("Zubehör", "Accessori", "Accessories")] },

];

export function findMediaCategory(slug: string): MediaCategory | undefined {
  return mediaCategories.find((c) => c.slug === slug);
}
