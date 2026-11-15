# Entwicklungsbericht Preis-Pilot 2.0

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
