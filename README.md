# Preis-Pilot 2.0 – Vergleichen. Sparen. Besser kaufen.

Web-App für Lebensmittel **und** Multimedia: Einkaufslisten, Budget, Preisvergleich auf Basis **belegter** Preise, technischer Produktvergleich, Abo-Center und Familienbudget. Für Deutschland und Italien, auf Deutsch, Italienisch und Englisch, ohne Konto nutzbar.

**Stand: Version 2.0** – alle Funktionen aus 1.0 (siehe `docs/FUNKTIONEN-1.0.md`) plus Multimedia-Welt. Was fertig ist und was bewusst fehlt, steht unten und im `ENTWICKLUNGSBERICHT.md`.

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

## Was 1.0 kann (weiterhin enthalten)

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

## Neu in 2.0

| Bereich | Status | Umsetzung |
|---|---|---|
| Zwei Welten, ein Design | fertig | Umschalter „Lebensmittel / Multimedia“ unter dem Kopfbereich auf allen Geräten. Multimedia ist dunkler und technischer (Petrol + Signalblau), gleiche Marke |
| Multimedia-Kategorien | fertig | TV & Heimkino, Smartphones & Tablets, Computer & Hardware, Gaming, Foto/Video/Audio, Software – je mit eigenem Datenblatt |
| Produkte & Varianten | fertig | Erfassung nach Datenblatt mit Herstellerquelle; Varianten (Modellnummer, Speicher, Größe, Plattform, Region, Edition) werden nie vermischt; leere Angaben bleiben „nicht angegeben“ |
| Best-Price-Engine | fertig | Gesamtpreis = Preis + Versand, unbekannter Versand hinten, Neu/Gebraucht/Refurbished/Vorführ/Digital/Abo getrennt, je Händler nur die jüngste Beobachtung, „aktuell“ nur ≤ 24 h |
| Preisverlauf | fertig | Nur echte Beobachtungen, Lücken sichtbar, 30/90/180-Tage-Tiefst- und Durchschnittspreis nur bei ausreichender Datenbasis, vorsichtige Einordnung statt Prognose |
| Referenzpreis § 11 PAngV | fertig | Niedrigster Preis desselben Händlers in den 30 Tagen vor einer Ermäßigung; ohne Daten ausdrücklich „nicht belegbar“ |
| Technischer Vergleich | fertig | Prioritäten je Merkmal (0–3), Punkte nur aus bei allen bekannten Werten, Datenblatt-Abdeckung, „nur Unterschiede“ |
| Kaufberater | fertig | Regelbasiert (keine KI): Kategorie, Budget, Mindestwerte, Prioritäten, gebraucht erlaubt; Ausschlussgründe sichtbar |
| SparGuard | fertig | Warnung nur bei belegter Abweichung (< 60 % des Medians) oder Nicht-Neuware; Fehlendes neutral als „unbekannt“ |
| Merkliste, Produktalarme | fertig | Alarm nur bei neu erfassten Angeboten unter der Grenze; Übersicht im SparRadar |
| Abo- & Streaming-Center | fertig | Monat/Jahr, nächste Zahlung, Kündigungstermin nur bei vollständigen Vertragsangaben, Abo-Sparcheck (Doppel-Abos, Jahrestarif, ungenutzt, Familientarif, Preiserhöhung). Keine Kontoanbindung, keine automatische Kündigung |
| Familienbudget, Sparziele | fertig | Monatsplan nach 8 Bereichen, bezahlte Einkäufe + aktive Abos werden gegengerechnet; Sparziele ohne Zinsversprechen |
| Spielepreise live | vorbereitet | `/api/games` (IsThereAnyDeal, autorisierte Shops, EUR). Aktiv mit `ITAD_API_KEY`; ohne Schlüssel klare Meldung |
| Filme/Serien, Streaming-Verfügbarkeit | vorbereitet | `/api/titles` (TMDB, Verfügbarkeit von JustWatch, nur Verweise). Aktiv mit `TMDB_API_TOKEN`; fehlende Länderangabe = „unbekannt“ |
| Shopping-Autopilot | Kern fertig | Prüft Alarme und Budget bei jedem Öffnen automatisch und zeigt Treffer; es gibt in der App keinen Kauf-, Zahlungs- oder Bestellweg (per Test abgesichert) |
| Datenmodell 2.0 | fertig, noch nicht angebunden | 13 neue Tabellen (`drizzle/0001_v2_multimedia.sql`), mit PGlite geprüft inkl. Variantensperre |
| Admin 2.0, Monetarisierung | vorbereitet | Tabelle `data_source_connections` (Quellenstatus) und Kennzeichnung `sponsored` für Partnerangebote. Nichts davon ist live – Freigabe nötig |

## Architektur

```
src/
  app/                 Seiten (App Router) und API-Routen
    [lang]/…           Sprachseiten
    [lang]/media/…     Multimedia-Welt (Übersicht, Kategorie, Produkt, Vergleich, Berater, Abos)
    api/               search, product/[code], prices, offers, category, comparisons, games, titles
  components/          Oberfläche (keine Geschäftslogik)
  lib/                 Geschäftslogik – rein, ohne Netzwerk, vollständig getestet
    money.ts           Geldbeträge in ganzen Cent
    units.ts           Mengen, Packungen, Grundpreise
    list-totals.ts     Listensummen mit fehlenden Preisen
    budget.ts          Budgets, Zeiträume, Doppelbuchungen
    basket.ts          Smart Basket / Supermarkt-Vergleich
    price-quality.ts   Qualitätsprüfung und Angebotsstatus
    alerts.ts          Preisalarme, Preiserhöhungen
    media/             2.0: Datenblätter (specs.ts) und Engine (Bestpreis, Verlauf, Vergleich, Berater, SparGuard)
    subscriptions.ts   2.0: Abo-Kosten, Fristen, Sparcheck
    household.ts       2.0: Familienbudget, Sparziele
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
| IsThereAnyDeal API (2.0, optional) | Spielepreise autorisierter Shops | Nutzungsbedingungen von ITAD, kostenloser Schlüssel | Quellenangabe (umgesetzt) |
| TMDB API (2.0, optional) | Film-/Serien-Metadaten, Streaming-Verfügbarkeit (Daten von JustWatch) | TMDB-Nutzungsbedingungen, kostenloser Schlüssel | Hinweis „TMDB · JustWatch“ (umgesetzt) |

Elektronikpreise: Es gibt keine freie, rechtlich nutzbare Quelle (EPREL-Produkt-API nur mit qualifiziertem E-Siegel, CheapShark nur USD, Scraping ausgeschlossen). Deshalb arbeitet der Multimedia-Bereich mit selbst erfassten, datierten Händlerangeboten, wie im Auftrag für diesen Fall vorgesehen. Händler- oder Affiliate-Feeds nur nach deiner Freigabe.

- User-Agent `Preis-Pilot/0.1 (info@vecom-design.it)` wird bei jeder Anfrage gesendet (Pflicht laut Open Food Facts). Anpassbar über `PREISPILOT_USER_AGENT`.
- Grenzen der Quelle: Produktabfragen 15/min, Suche 10/min pro IP. Daher Server-Cache (Produkte: Stunden, Preise: Minuten) und eigenes Rate-Limit (60/min pro Client).
- Vor dem öffentlichen Start: Open-Food-Facts-Nutzungsformular ausfüllen (API usage form, siehe deren Doku).
- Kein Scraping, keine Umgehung von Schutzmaßnahmen. Händler-APIs nur nach Freigabe.

## Preisqualität

Ausgeschlossen aus Vergleichen, Summen und Alarmen: Preise älter als 365 Tage, doppelte Einträge, unplausible Beträge (< 0,01 € oder > 1.000 €), Ausreißer (> 3× bzw. < ⅓ des Medians desselben Produkts), Datum in der Zukunft. Älter als 90 Tage wird markiert. Angebote gelten nur mit belegter Laufzeit als „aktuell“ – Open Prices liefert keine, daher nie „aktuell“.

## Tests

```bash
npm test                 # 52 Unit-Tests (Logik 1.0 + 2.0, echte API-Antworten in tests/fixtures, Code-Wächter)
npm run test:live        # 7 Live-Tests gegen die laufende App und die echten Quellen (LIVE=1, PP_BASE_URL)
npm run test:e2e         # 12 Browser-Tests (CHROME_PATH, PP_BASE_URL)
npm run test:a11y        # axe-core WCAG 2.2 AA auf 13 Seiten, mobil und Desktop
npm run typecheck && npx eslint src
```

Pflichttests 1.0 (1–20) siehe unten, Pflichttests 2.0 (1–25) siehe `ENTWICKLUNGSBERICHT.md`.

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

- 2.0: Multimedia-Preise stammen nur aus deinen eigenen Erfassungen (mit Datum und Händler) – bis ein Händler-Feed freigegeben ist. Spiele- und Filmdaten brauchen die kostenlosen Schlüssel.
- 2.0: Multimedia-Daten liegen wie alle Daten nur im Browser; Admin-Oberfläche und Synchronisation folgen mit dem Backend (Phase 6).

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
