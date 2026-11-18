# Entwicklungsbericht Preis-Pilot 3.0 – Ultimate Deal Finder

Stand: 18.11.2026

## Kurzfassung

3.0 ergänzt Preis-Pilot um einen Angebotsfinder für Deutschland und Italien: echte Angebote aus angebundenen Quellen, 32 Kategorien, ein nachvollziehbarer Deal-Score, Preisalarme, eine Hintergrundaktualisierung alle 30 Minuten und ein geschütztes Admin-Dashboard. Design, Rubriken, Einkaufswagen und alle Funktionen aus 1.0 und 2.0 bleiben erhalten. Es gibt kein Glücksrad und keine Pop-ups.

Die ehrliche Lage: Ohne Schlüssel sind nur Quellen nutzbar, die ihre Daten frei und erlaubt anbieten. Das sind heute Lebensmittel (Open Prices) und PC-Spiele (GOG, Steam). Technik, Haushalt und Auto füllen sich erst, wenn eBay- oder Awin-Zugänge eingetragen sind. Die Anschlüsse dafür sind fertig gebaut und getestet.

## Tatsächlich angebundene Quellen (Lauf vom 18.11.2026)

| Quelle | Art | Abgerufen DE / IT | Nach Abgleich gespeichert DE / IT |
|---|---|---|---|
| Open Prices (Open Food Facts) | öffentliche API, ODbL | 173 / 23 | 45 / 2 |
| GOG | öffentlicher Katalog | 96 / 96 | 96 / 96 |
| Steam | öffentliche Store-Schnittstelle | 12 / 11 | 10 / 9 |
| **Summe echte Angebote** | | | **151 / 107 = 258** |

Bei Open Prices fallen Einträge weg, die älter als 14 Tage sind oder dasselbe Produkt beim selben Händler doppelt melden. Kategorien heute: Gaming 211, Lebensmittel 46, Beauty 1.

## Quellen, die noch Zugangsdaten oder Freigaben brauchen

| Quelle | Was nötig ist | Kosten | Status im Code |
|---|---|---|---|
| eBay Browse API (DE, IT) | Entwicklerkonto, `EBAY_CLIENT_ID` und `EBAY_CLIENT_SECRET`; optional `EBAY_CAMPAIGN_ID` | kostenlos | fertig, wird mit Schlüssel aktiv; bringt Technik, Haushalt, Auto |
| isthereanydeal | `ITAD_API_KEY` | kostenlos | fertig |
| Awin-Händler-Feeds (z. B. Elektronik- und Baumärkte) | Publisher-Konto, Freigabe je Händler, Feed-URL in `FEEDS_JSON` | kostenlos, Freigabe durch Händler | fertig (Awin- und Google-Merchant-Format) |
| Amazon Product Advertising API | Partnerkonto mit qualifizierten Verkäufen | kostenlos, an Umsätze gebunden | nicht gebaut, dokumentiert |
| idealo, Geizhals | Partnerschaftsvertrag | auf Anfrage | nicht gebaut, dokumentiert; kein Scraping |

## Umgesetzt

- **Anschlüsse** einheitlich in `src/lib/deals/connectors/`, je Quelle Intervall, Länder, Nutzungsbedingungen und benötigte Schlüssel. Neue Quellen kommen über eine Datei oder einen Feed-Eintrag dazu.
- **Abgleich** (`pipeline.ts`): Dubletten über Land, Händler, GTIN und Zustand, Ablaufdatum, Höchstalter (online und digital 3 Tage, Laden 14 Tage), gesperrte Händler, Preisverlauf mit Tagestiefstwert über 90 Tage.
- **Vergleichspreise rechtssicher getrennt:** UVP, früherer Händlerpreis, eigener 30-Tage-Tiefstpreis (erst ab 20 Beobachtungstagen, vorher gar nicht) und Marktpreis (Median aus mindestens zwei anderen Händlern mit gleicher GTIN). Jede Karte nennt die Basis. Ohne belastbare Basis zeigt die Karte keinen Rabatt und keine Ersparnis.
- **Deal-Score 0–100** mit Begründung je Punkt: Rabatt gewichtet nach Basis, günstiger anderswo, Tiefstpreis, Verfügbarkeit, Versand, Zustand, Aktualität, Händlerbewertung. Ab 95 % (digital) bzw. 70 % (sonst) erscheint „Verdacht auf Preisfehler“ statt Extrapunkten.
- **Startseite** mit allen geforderten Bereichen; leere Bereiche erscheinen nicht.
- **Suche und Kategorien:** 32 Kategorieseiten, Filter und Sortierung über die Adresszeile teilbar, auf dem Handy einklappbar.
- **Preisalarm und Merkliste** im Browser, Hinweis über die Glocke im Kopf und im Radar.
- **Hintergrund:** Netlify Scheduled Function alle 30 Minuten, je Quelle bis zu 3 Versuche, Zod-Prüfung jedes Datensatzes, Protokoll der letzten 100 Läufe. Lokal läuft dieselbe Logik über `npm run deals:update`, auf deinem Rechner als Windows-Aufgabe „Preis-Pilot Angebots-Update“ alle 30 Minuten.
- **Admin-Dashboard** `/de/admin`: Kennzahlen, Quellen an/aus, Intervalle, Händler sperren, Angebote je Kategorie, Laufprotokoll, „Jetzt aktualisieren“. Ohne `ADMIN_TOKEN` (mindestens 16 Zeichen) ist es komplett gesperrt.
- **Kennzeichnung:** Affiliate-Links mit `rel="sponsored"` und „Werbung“, alle externen Links mit `noopener noreferrer nofollow`.

## Pflichttests 3.0

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests (Vitest), davon 17 neu für 3.0 | 71 bestanden, 7 übersprungen (brauchen Live-Schlüssel) |
| Browser-Tests (Puppeteer), davon 5 neu | 18 / 18 |
| Barrierefreiheit (axe-core, 38 Seitenansichten inkl. Angebotsseiten) | 38 / 38 ohne Verstoß |
| Produktions-Build lokal und auf deinem Rechner | erfolgreich |
| Echter Abruf auf deinem Rechner | 258 Angebote, alle 6 Quellen-Läufe im ersten Versuch |
| Admin ohne / mit Login (lokal) | 401 / 200 |

## Rust-Prüfung

Kein Vorteil. Die Arbeit besteht aus Netzwerkabrufen, JSON-Prüfung und Sortierung von einigen hundert Datensätzen; ein Lauf dauert unter 2 Sekunden und wartet fast nur auf die Quellen. Rust würde einen zweiten Build-Weg auf Netlify erzwingen, ohne messbaren Gewinn.

## Was von dir noch gebraucht wird

1. **Admin-Passwort auf Netlify:** `ADMIN_TOKEN` als geheime Umgebungsvariable setzen (Bereiche Functions und Runtime). Bis dahin bleibt `/admin` online gesperrt.
2. **eBay-Entwicklerkonto** (kostenlos), damit Technik, Haushalt und Auto echte Angebote bekommen.
3. Optional **Awin-Publisher-Konto** und **ITAD-Schlüssel**.
4. Weiterhin offen aus 2.0: Betreiberangaben für Impressum und Datenschutz.

---

# Rückblick: Entwicklungsbericht Preis-Pilot 2.0

Stand: 15.11.2026 · Slogan: „Vergleichen. Sparen. Besser kaufen.“

## Kurzfassung

Preis-Pilot 2.0 erweitert die Lebensmittel-App um eine eigene Multimedia-Welt mit technischem Produktvergleich, Best-Price-Engine, Preisverlauf, Kaufberater, SparGuard, Abo-Center und Familienbudget. Alle Funktionen aus 1.0 sind erhalten, und gespeicherte 1.0-Daten werden unverändert weiter gelesen.

Die Einschränkung ehrlich vorweg: Für Elektronikpreise gibt es keine freie, rechtlich nutzbare Quelle. Der Multimedia-Bereich rechnet deshalb mit Händlerangeboten, die du selbst erfasst, jeweils mit Datum und Händler. So sieht es der Auftrag für diesen Fall vor. Erfundene Preise gibt es nicht.

Spiele- und Filmdaten sind fertig angebunden. Sie werden aktiv, sobald die kostenlosen Schlüssel eingetragen sind.

## Phasen

| Phase | Ergebnis | Status |
|---|---|---|
| 1 Analyse und Migration | Sicherung (Tag `v0.2`), Funktionsliste `docs/FUNKTIONEN-1.0.md`, Speicherschema abwärtskompatibel erweitert | ✓ |
| 2 Multimedia-Grundstruktur | 6 Kategorien mit Datenblättern, Produkterfassung, Produktseite, Weltwechsel, dunkles Multimedia-Design | ✓ |
| 3 Elektronik-Preisvergleich | Gesamtpreis inkl. Versand, Zustände getrennt, Frische-Regel 24 h, Bestpreis, SparGuard | ✓ (Preise aus eigener Erfassung) |
| 4 Preisverlauf und Alarme | Verlauf mit Lücken, 30/90/180 Tage, § 11 PAngV, vorsichtige Einordnung, Produktalarme im SparRadar | ✓ |
| 5 Abos, Streaming, Gaming | Abo-Center mit Fristen und Sparcheck; `/api/games` (IsThereAnyDeal) und `/api/titles` (TMDB/JustWatch) | ✓ / Live-Quellen warten auf Schlüssel |
| 6 Kaufberater und Familienbudget | Regelbasierter Berater, technischer Vergleich mit Prioritäten, Familienbudget, Sparziele | ✓ |
| 7 Admin, SEO, Monetarisierung | Sitemap um 11 Multimedia-Seiten je Sprache erweitert, Metadaten/hreflang, DB-Tabellen für Quellenstatus und Kennzeichnung von Partnerangeboten | SEO ✓, Admin und Monetarisierung vorbereitet (nicht live) |
| 8 Tests, Qualität, Deployment | 52 Unit-, 7 Live-, 12 Browser-Tests, axe auf 26 Seitenansichten, Netlify-Deploy | ✓ |

## Pflichttests 2.0

| # | Test | Ergebnis | Nachweis |
|---|---|---|---|
| 1 | 1.0 bleibt funktionsfähig | ✓ | Browser 1–6, Unit „Regression 1.0“, „Gespeicherte 1.0-Daten“, Browser „alte 1.0-Daten bleiben erhalten“ |
| 2 | Lebensmittel- und Elektronikpreise getrennt | ✓ | Getrennte Datenmodelle (`offers` Open Prices vs. `merchant_offers`), getrennte Welten und Speicherbereiche |
| 3 | Varianten eindeutig | ✓ | Unit „Varianten“, Browser „gleiche Variante abgewiesen“, Datenbank-Unique-Index (PGlite geprüft) |
| 4 | Fernseher technisch vergleichbar | ✓ | Unit + Browser „Technischer Vergleich“ |
| 5 | Smartphones und PCs korrekt gefiltert | ✓ | Unit „berät nach Budget, Mindestwerten und Kategorie“ |
| 6 | Versand verändert Gesamtpreis | ✓ | Unit Best-Price-Engine, Browser (979 € + 9,90 € schlägt 999 €) |
| 7 | Neu und gebraucht unterscheidbar | ✓ | Unit, Produktseite gruppiert nach Zustand |
| 8 | Spiele nach Plattform und Region | ✓ | Unit „Digitale Spiele nach Plattform und Region“; Live-Preise mit Schlüssel |
| 9 | Abos monatlich/jährlich richtig | ✓ | Unit + Browser (2 × 12,99 € = 25,98 €/Monat) |
| 10 | Kündigungsdaten belastbar | ✓ | Termin nur bei vollständigen Angaben, sonst „fehlt: …“ (Unit + Browser) |
| 11 | Wunschlisten | ✓ | Merkliste auf Produktseite und Übersicht |
| 12 | Alarme auf reale neue Angebote | ✓ | Unit „löst nur bei neuen Angeboten unter der Grenze aus“ |
| 13 | Diagramme zeigen echte Beobachtungen | ✓ | Unit; Linie bricht bei Lücken > 7 Tage ab, keine Zwischenwerte |
| 14 | Prognosen kennzeichnen Unsicherheit | ✓ | Unit; „zu wenige Beobachtungen“ und Hinweis „keine Vorhersage“ |
| 15 | Familienbudgets richtig | ✓ | Unit (Zuordnung, Monat, nur bezahlt) + Browser |
| 16 | Autopilot erstellt keine Käufe | ✓ | Code-Wächter-Test: kein Bestell-/Zahlungsweg, POST nur an Preisquelle |
| 17 | Unbekannte Angaben nicht erfunden | ✓ | Unit; leere Felder bleiben „nicht angegeben“, Vergleich bewertet nur bekannte Werte |
| 18 | Keine unerlaubten Medieninhalte | ✓ | Code-Wächter-Test: kein iframe/Player/Torrent; nur Verweise auf Dienste |
| 19 | Import und Export | ✓ | Browser-Test Export; 2.0-Daten sind Teil desselben geprüften Schemas |
| 20 | Mobile Darstellung | ✓ | Browser-Tests mobil (390 px), axe mobil, eigene Mobilnavigation je Welt |
| 21 | Mehrsprachigkeit vollständig | ✓ | Wörterbücher DE/IT/EN typgeprüft gleich aufgebaut (fehlende Schlüssel = Build-Fehler) |
| 22 | Datenschutz und Zugriffsrechte | ✓ für v2.0 | Alle Daten nur im Browser, keine Kontoanbindung, keine Tracker; serverseitige Rechte erst mit Backend |
| 23 | Fehlende APIs verständlich | ✓ | Unit + Live: 503 `missing_key`, Oberfläche zeigt Klartext-Hinweis |
| 24 | Vergleich ohne kostenpflichtige KI | ✓ | Regelbasiert, kein KI-Dienst im Code |
| 25 | SEO und Performance | ✓ | Sitemap, hreflang, kanonische Adressen, statisch vorgerenderte Seiten (158), axe 0 Verstöße |

Testlauf 15.11.2026:
- Unit-Tests: 52/52 bestanden.
- Live-Tests: 7/7 bestanden. Der erste Lauf ergab 6/7, weil eine externe Quelle nicht rechtzeitig antwortete. Der Wiederholungslauf war vollständig grün.
- Browser-Tests: 12/12 bestanden.
- axe-core (WCAG 2.2 AA): 26/26 Seitenansichten ohne Verstoß.
- TypeScript und ESLint: 0 Befunde.

## Bewusste Grenzen

- **Elektronikpreise:**
  - Keine automatische Preisquelle.
  - Die EPREL-Produkt-API verlangt ein qualifiziertes E-Siegel.
  - CheapShark liefert nur USD.
  - Scraping ist ausgeschlossen.
  - Händler- oder Affiliate-Feeds kommen erst nach deiner Freigabe (Kennzeichnung „sponsored“ ist im Datenmodell vorbereitet).
- **Spiele und Filme:** Der Code ist fertig, aber ohne Schlüssel nicht live getestet. Nötig sind:
  - `ITAD_API_KEY` (isthereanydeal.com/apps/my)
  - `TMDB_API_TOKEN` (themoviedb.org/settings/api)
- **Admin 2.0:** Die Tabellen sind angelegt. Die Oberfläche kommt mit Konten und Backend (Phase 6), weil v2.0 bewusst nichts auf dem Server speichert.
- **Monetarisierung:** Nur vorbereitet. Es ist nichts aktiv, und nichts wird ohne deine ausdrückliche Freigabe aktiviert.
- **Abos:** Nur eigene Eingaben. Preis-Pilot liest keine fremden Konten aus und kündigt nie selbst.

## Rust-Prüfung

Geprüft wurde Rust/WebAssembly für Vergleich, Berater und Preisverlauf.

Ergebnis: **kein Vorteil**. Selbst hunderte Produkte und tausende Beobachtungen rechnet TypeScript in wenigen Millisekunden. WebAssembly würde Paketgröße und Komplexität erhöhen, ohne spürbaren Nutzen.

Neu bewerten, falls Händler-Feeds mit sehr großen Datenmengen dazukommen.

## Was von dir noch gebraucht wird

1. Kostenlose Schlüssel für IsThereAnyDeal und TMDB, dann in Netlify als Umgebungsvariablen eintragen.
2. Betreiberangaben für Impressum und Datenschutz.
3. Freigabe für die Bilderzeugung mit Kie.ai (Hero-Bild zeigt noch „PreisPilot“ ohne Bindestrich).
4. Entscheidung über Händler-/Affiliate-Feeds und Monetarisierung.

## Nachtrag 15.11.2026: Rubriken-Design und Einkaufswagen

- Umgesetzt nach Uwes Designbögen:
  - Startseite „Preis-Pilot | Multimedia“ mit Einkaufs- und violettem Multimedia-Panel.
  - Neun Rubrikseiten im einheitlichen Vorlagen-Design.
  - Rubriken-Leiste zum Wechseln.
  - Einkaufswagen als kleines Fenster, das aus allen Rubriken eine Einkaufsliste macht.
- Das dunkle Multimedia-Design aus 2.0 ist entfallen: Die Vorlagen zeigen alle Rubriken hell. Die Produktseiten liegen jetzt unter `/[lang]/produkte/…`.
- Abweichung von der Vorlage: Die Preistabellen der Vorlage zeigen Beispielpreise großer Händler. Echte Preise gibt es nur für Lebensmittel (Open Prices). Die anderen Rubriken zeigen deshalb nur selbst erfasste, datierte Angebote, sonst einen Hinweis.
- Tests:
  - Unit-Tests: 54/54
  - Live-Tests: 7/7
  - Browser-Tests: 13/13 (neu: Rubriken-Leiste, Einkaufswagen bis zur Liste)
  - axe: 32/32 Seitenansichten ohne Verstoß
  - Kopfbereich ohne Überlauf in fünf Breiten (390–1600 px)
- Rust: kein Vorteil (reine Oberfläche und kleine Rechnungen).
- Offen: scharfe Rubrikbilder über Kie.ai, sobald du das Auslesen des Schlüssels freigibst.
