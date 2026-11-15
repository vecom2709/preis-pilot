# Funktionsliste Preis-Pilot 1.0 (Stand vor 2.0, Sicherung: Git-Tag `v0.2`)

Diese Liste wurde vor dem Umbau erfasst (Phase 1 des 2.0-Auftrags). Alle Punkte sind in 2.0 weiter vorhanden. Geprüft wird das mit den Browser-Tests 1–6 und den Unit-Tests „Regression 1.0“ sowie „Gespeicherte 1.0-Daten“.

| Bereich | Route | Funktion | In 2.0 |
|---|---|---|---|
| Startseite | `/[lang]` | Suche, Kategorien, Packungsrechner, Vergleiche, Planer-Einstieg (nach Uwes Entwurf) | ✓ unverändert |
| Preisvergleich | `/search` | Suche nach Name, Marke, Barcode (Open Food Facts), Preisanzahl je Treffer | ✓ |
| Produktseite | `/product/[code]` | Belegte Preise je Geschäft, Grundpreis, Verlauf, Preiserhöhung, Merken, Alarm | ✓ |
| Kategorien | `/categories`, `/category/[slug]` | 14 Lebensmittel-Kategorien mit beliebten Produkten des Landes | ✓ |
| Vergleiche | `/comparisons` | Echte Kettenvergleiche aus Open Prices | ✓ |
| Scanner | `/scan` | BarcodeDetector oder ZXing, Prüfziffer, manuelle Eingabe | ✓ |
| Einkaufslisten | `/lists` | Mehrere Listen, Mengen, Preise, Summe, Smart Basket (Variante A/B), Export/Import | ✓ |
| Budget | `/budget` | Budgets je Zeitraum, geplant/geschätzt/bezahlt, Doppelbuchungsschutz, Monatsverlauf | ✓ + Familienbudget, Sparziele |
| Angebote | `/offers` | Dokumentierte reduzierte Preise, „Gültigkeit nicht belegt“ | ✓ |
| SparRadar | `/radar` | Preisalarme (Lebensmittel), gemerkte Produkte | ✓ + Produktalarme Multimedia |
| Auswertungen | `/insights` | Monatsverlauf, Kategorien, Durchschnitt | ✓ |
| Mein Konto | `/account` | Einstellungen, Export, Import, Löschen (ohne Konto) | ✓ – Export/Import enthalten 2.0-Daten |
| Quellen, Datenschutz | `/sources`, `/privacy` | Lizenzen (ODbL), Datenschutzhinweise | ✓ |
| PWA | – | Installierbar, offline für Listen und Budget | ✓ |
| Sprachen | `/de` `/it` `/en` | Vollständig übersetzt, hreflang | ✓ |
| APIs | `/api/search`, `/api/product/[code]`, `/api/prices`, `/api/offers`, `/api/category`, `/api/comparisons` | Server-Abfragen mit Ratenbegrenzung | ✓ + `/api/games`, `/api/titles` |
| Datenmodell | `src/db/schema.ts` | 18 Tabellen (PostgreSQL, Drizzle) | ✓ + 13 Tabellen in `0001_v2_multimedia.sql` |

Gespeicherte Browserdaten (`preispilot:v1`) aus 1.0 werden in 2.0 unverändert gelesen; die neuen Bereiche werden leer ergänzt.
