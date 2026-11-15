# Preis-Pilot – Clever einkaufen. Mehr sparen.

Web-App für Einkaufslisten, Budget und Preisvergleich auf Basis **belegter** Preise. Für Deutschland und Italien, auf Deutsch, Italienisch und Englisch, ohne Konto nutzbar.

**Stand: Version 0.1** = Phase 1 komplett, dazu der funktionsfähige Kern aus Phase 2–4 (siehe unten).

---

## Schnellstart

Voraussetzung: Node.js ≥ 20.9 (empfohlen 22 LTS).

```bash
npm install
npm run dev          # Entwicklung: http://localhost:3000 (Telemetrie aus: npx next telemetry disable)
npm run build && npm run preview   # Produktionsfassung lokal (ohne Live-Neuladen)
```

Mit Docker (App + PostgreSQL für spätere Phasen):

```bash
docker compose up --build
```

Konfiguration über `.env` (Vorlage: `.env.example`). Für den reinen Betrieb von v0.1 ist **keine** Datenbank und **kein** API-Schlüssel nötig.

## Was v0.1 kann

| Bereich | Status | Umsetzung |
|---|---|---|
| Design, Navigation (8 Bereiche), Hell/Dunkel, Mobile First | fertig | Eigenes Design-System (Tannengrün, Off-White, Anthrazit, Safran nur für Angebote), Schrift Archivo selbst gehostet |
| Sprachen DE / IT / EN | fertig | Sprachrouten `/de` `/it` `/en`, automatische Erkennung, hreflang, Zahlen-/Datumsformate je Sprache |
| Produktsuche (Name, Marke, Kategorie, Barcode) | fertig | Open Food Facts (Search-a-licious + API v3), Länderfilter, Anzahl dokumentierter Preise je Treffer |
| Produktseite mit Preisen | fertig | Jüngster Preis je Geschäft, Grundpreis, Datum, Nachweisart, Link zum Nachweisfoto, Preisverlauf, Preiserhöhungs-Erkennung, ausgeschlossene Einträge mit Grund |
| Packungsgrößen-Vergleich | fertig | Rechner (Startseite + Preisvergleich), vergleicht nur gleichartige Mengen |
| Barcode-Scanner | fertig | BarcodeDetector (Android/Chrome) oder ZXing (iOS/Safari/Firefox), Kamerawechsel, Licht, Autofokus, manuelle Eingabe mit Prüfziffer |
| Einkaufslisten | fertig | Mehrere Listen, Kategorien, Mengen, abhaken, manuelle Preise, Preise aus Daten, Wiederkehrend/Vorrat, Export/Import (JSON), Summe sofort |
| Supermarkt-Vergleich + Smart Basket | Kern fertig | Variante A (ein Geschäft) und B (zwei Geschäfte) nur mit belegten Preisen, Teilsummen, fehlende Artikel je Markt, eigene Mindestersparnis, Kette oder Filiale |
| Budget | fertig | Pro Einkauf/Tag/Woche/Monat, Kategorie, Person/Haushalt, Warnschwelle, geplant/geschätzt/bezahlt getrennt, Doppelbuchungs-Schutz, Monatsvergleich |
| Angebote | fertig | Dokumentierte reduzierte Preise je Land – ausdrücklich „Gültigkeit nicht belegt“ |
| SparRadar | Kern fertig | Preisalarme mit eigener Grenze (nur neue, geprüfte Beobachtungen), gemerkte Produkte |
| Auswertungen | fertig | Monatsverlauf, Kategorien, Durchschnitt, geplant/geschätzt/bezahlt |
| Mein Konto (ohne Konto) | fertig | Export aller Daten, Import, vollständige Löschung, Einstellungen |
| PWA | fertig | Installierbar, Service Worker, Listen und Budget offline nutzbar |
| SEO | fertig | Metadaten je Seite, kanonische Adressen, hreflang, Sitemap, robots.txt, strukturierte Daten (Product + belegte Preisspanne) |
| Datenmodell PostgreSQL (alle 17 Modelle + Haushaltsmitglieder) | fertig, noch nicht angebunden | `src/db/schema.ts`, Migration `drizzle/0000_init.sql` |

## Architektur

```
src/
  app/                 Seiten (App Router) und API-Routen
    [lang]/…           Sprachseiten
    api/               search, product/[code], prices, offers  (Zod-validiert, Rate-Limit)
  components/          Oberfläche (keine Geschäftslogik)
  lib/                 Geschäftslogik – rein, ohne Netzwerk, vollständig getestet
    money.ts           Geldbeträge in ganzen Cent
    units.ts           Mengen, Packungen, Grundpreise
    list-totals.ts     Listensummen mit fehlenden Preisen
    budget.ts          Budgets, Zeiträume, Doppelbuchungen
    basket.ts          Smart Basket / Supermarkt-Vergleich
    price-quality.ts   Qualitätsprüfung und Angebotsstatus
    alerts.ts          Preisalarme, Preiserhöhungen
    sources/           Datenzugriff: Adapter für externe Quellen (*-map.ts = reine Abbildung)
    store/             Lokale Speicherung (Zod-Schema, Tab-Synchronisation)
  i18n/                Sprachen und Wörterbücher
  db/                  PostgreSQL-Schema (Drizzle)
tests/                 Unit-, Live- und Browser-Tests
```

Technik: Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Zod, Drizzle ORM, Vitest. Keine kostenpflichtigen Dienste, keine Tracking- oder Werbeskripte.

Warum Drizzle statt Prisma: reines TypeScript ohne zusätzliche Binärdateien, läuft auf jedem Free-Tier-Hosting; die SQL-Migration ist geprüft (18 Tabellen, Doppelbuchungs-Sperre per Unique-Index).

## Datenquellen und Lizenzen

| Quelle | Nutzung | Lizenz | Pflichten |
|---|---|---|---|
| Open Food Facts API v3 | Produktdaten per Barcode | ODbL (Datenbank), DbCL (Inhalte), Bilder CC BY-SA 3.0 | Quellenangabe auf jeder Seite (umgesetzt im Fußbereich und auf der Produktseite), Share-Alike bei abgeleiteten Datenbanken |
| Search-a-licious | Volltextsuche | wie oben | – |
| Open Prices API v1 | Preise, Geschäfte, Nachweise | ODbL, Nachweisfotos CC BY-SA 4.0 | wie oben |

- User-Agent `Preis-Pilot/0.1 (info@vecom-design.it)` wird bei jeder Anfrage gesendet (Pflicht laut Open Food Facts). Anpassbar über `PREISPILOT_USER_AGENT`.
- Grenzen der Quelle: Produktabfragen 15/min, Suche 10/min pro IP. Daher Server-Cache (Produkte: Stunden, Preise: Minuten) und eigenes Rate-Limit (60/min pro Client).
- Vor dem öffentlichen Start: Open-Food-Facts-Nutzungsformular ausfüllen (API usage form, siehe deren Doku).
- Kein Scraping, keine Umgehung von Schutzmaßnahmen. Händler-APIs nur nach Freigabe.

## Preisqualität

Ausgeschlossen aus Vergleichen, Summen und Alarmen: Preise älter als 365 Tage, doppelte Einträge, unplausible Beträge (< 0,01 € oder > 1.000 €), Ausreißer (> 3× bzw. < ⅓ des Medians desselben Produkts), Datum in der Zukunft. Älter als 90 Tage wird markiert. Angebote gelten nur mit belegter Laufzeit als „aktuell“ – Open Prices liefert keine, daher nie „aktuell“.

## Tests

```bash
npm test                 # 28 Unit-Tests (Logik + echte, unveränderte API-Antworten in tests/fixtures)
npm run test:live        # 7 Live-Tests gegen die laufende App und die echten Quellen (LIVE=1, PP_BASE_URL)
npm run test:e2e         # 5 Browser-Tests (CHROME_PATH, PP_BASE_URL)
npm run typecheck && npx eslint src
```

Stand 15.11.2026: 40/40 bestanden, 0 ESLint-Befunde, axe-core (WCAG 2.2 AA) auf 11 Seiten in Hell und Dunkel: 0 Verstöße.

| Pflichttest aus dem Auftrag | Status |
|---|---|
| 1 Produktsuche liefert echte Daten | ✓ Live + Fixture |
| 2 Barcode-Scan | ✓ Prüfziffer/Normalisierung; Kamera-Erkennung auf echten Geräten noch zu prüfen |
| 3 Fehlende Preise gekennzeichnet | ✓ |
| 4 Kilopreise | ✓ |
| 5 Packungsgrößen | ✓ |
| 6 Listen-Gesamtsummen | ✓ Unit + Browser |
| 7 Budgetwarnungen | ✓ |
| 8 Optimierer berücksichtigt unbekannte Preise | ✓ |
| 9 Angebote nicht ohne Gültigkeitsnachweis aktuell | ✓ Unit + Live |
| 10 Preisalarme | ✓ |
| 11 Kassenbon-Korrekturen | offen – Phase 5 |
| 12 Doppelte Kaufbuchungen | ✓ Unit + Browser + Datenbank-Index |
| 13 Moderation von Beiträgen | offen – Phase 5 |
| 14 Export und Löschung | ✓ Browser (lokal); serverseitig ab Phase 6 |
| 15 Fremde Nutzer lesen keine privaten Daten | v0.1 speichert nichts auf dem Server; Test ab Phase 6 |
| 16 PWA bei eingeschränkter Verbindung | ✓ Browser (offline) |
| 17 DE/IT Sprach- und Regionalangaben | ✓ Live + Browser + Unit |
| 18 Android und iOS bedienbar | Mobil-Emulation ✓; Test auf echten Geräten steht aus |
| 19 Ohne kostenpflichtige KI | ✓ (keine KI-Dienste im Code) |
| 20 Regressionstests | ✓ alle Suiten automatisiert |

## Offen dokumentierte Einschränkungen

- Die Preisabdeckung ist lückenhaft (Open Prices: rund 1.100 Geschäfte in Deutschland, rund 270 in Italien). Viele Produkte zeigen „Preis nicht verfügbar“ – gewollt, statt zu raten.
- Kettenpreise stammen aus einzelnen Filialen.
- Variante C (Eigenmarken/Alternativen), Pfand und Fahrtkosten: noch nicht berechnet.
- Gemeinsame Listen, Konten, Push-Mitteilungen: erst mit Backend (Phase 6).
- Impressum und Verantwortlicher im Datenschutz: müssen vor der Veröffentlichung ergänzt werden.
- Bilder der Startseite (Hero, Kategorien, Planer) sind vorerst Ausschnitte aus Uwes Entwurf: geringe Auflösung, das Notebook zeigt noch „PreisPilot“ ohne Bindestrich. Werden durch neu erzeugte Bilder ersetzt.
- Händlernamen erscheinen als Text, nicht als Logo (Markenrecht).

## Rust-Prüfung

Geprüft wurde Rust/WebAssembly für den Einkaufsoptimierer und den Barcode-Scanner. Ergebnis: **kein echter Vorteil**. Der Optimierer rechnet mit wenigen Dutzend Positionen in unter einer Millisekunde, und der Scanner nutzt die eingebaute Browser-Erkennung bzw. ZXing. Neu zu bewerten, sobald Kassenbon-Texterkennung oder große Datenimporte dazukommen.

## Nächste Phasen

- Phase 4 (Rest): Alternativen und Eigenmarken (Variante C), Preisverlauf über mehrere Geschäfte
- Phase 5: Kassenbon-Erfassung (Tesseract.js, auf dem Gerät), Vorratsschrank mit MHD, Community-Preisbeiträge (Rückmeldung an Open Prices) mit Moderation
- Phase 6: Freiwillige Konten, Haushalte, Synchronisation, Administrationszentrale (PostgreSQL-Schema liegt bereit)
- Phase 7: Lasttests, Core-Web-Vitals-Messung im Feld, Deployment
