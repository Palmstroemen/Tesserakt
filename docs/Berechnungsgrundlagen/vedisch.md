# Berechnungsgrundlagen – Vedische Astrologie (Jyotish)

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026. Allgemeines: `00_allgemein.md`.*

## Was wir berechnen

- **Tierkreis:** siderisch mit **Lahiri-Ayanamsha** (Chitrapaksha), dem in Indien amtlichen Standard.
  Für eine Geburt 1985 beträgt sie etwa 23,65°.
- **Mond-Nakshatra:** eines der 27 Mondhäuser aus der siderischen Mondposition, mit dem bereits
  durchlaufenen Anteil.
- **Vimshottari-Dasha:** 120-jähriger Zyklus (Ketu 7, Venus 20, Sonne 6, Mond 10, Mars 7, Rahu 18,
  Jupiter 16, Saturn 19, Merkur 17 Jahre). Startpunkt aus dem Herrscher des Geburts-Nakshatras und dem
  bereits verstrichenen Anteil; aktuelle Mahadasha aus dem Alter mit Nachkommastellen.
- **Yogas:** einfache Raja-Yogas aus der Stellung der Hausherrscher (ganze Zeichen ab dem siderischen
  Aszendenten).
- **Quellen der Regeln:** Parashara (BPHS), Mantreswara (Phaladeepika).

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Lebensalter als Differenz der Jahreszahlen; die Dasha-Position sprang am 1. Januar. | Alter mit Nachkommastellen (Commit `fa8f7e3`). |
| 20.10.2026 | **Ayanamsha:** Der Code-Kommentar nannte Lahiri, tatsächlich galt die Voreinstellung der Swiss Ephemeris, **Fagan/Bradley** (etwa 0,9° mehr). Nahe den Nakshatra-Grenzen ergab das ein falsches Geburts-Nakshatra und damit einen falschen Dasha-Beginn. | Lahiri ausdrücklich gesetzt. |
| 20.10.2026 | **Yogas** wurden mit **tropischen** Zeichen bestimmt, rund 24° neben den siderischen. | Siderische Zeichen für Aszendent und Planeten. |

## Bekannte Vereinfachungen

- **Antardasha (Unterperioden)** wird noch nicht verwendet: Die Regeldaten enthalten nur 4 von 9
  Hauptperioden (Ketu, Venus, Jupiter, Saturn). Ergänzung als Inhaltsprojekt vorgesehen.
- **Gochara (Transite)** fehlt; es liegen keine Regeln vor.
- Nur ein kleiner Teil der Yogas; keine Divisionalhoroskope (Navamsa usw.), keine Shadbala.
- Aszendent und Yogas sind von der fehlenden Zeitzonen-Umrechnung betroffen (`00_allgemein.md`);
  das Nakshatra kaum (der Mond wandert etwa 0,5° pro Stunde, ein Nakshatra umfasst 13°20').
- Ohne Ephemeris (z. B. in Tests) fällt das Nakshatra auf eine grobe Schätzung aus dem Tag des Jahres
  zurück. Im Spiel steht die Ephemeris immer zur Verfügung.

## Was ein erfahrener Jyotishi anders macht

Er liest Dasha und Antardasha zusammen mit Gochara und den Divisionalhoroskopen, beurteilt die Stärke
der Planeten (Shadbala) und kennt Hunderte Yogas. Viele würden zudem die Ayanamsha-Wahl begründen oder
eine andere bevorzugen (z. B. Raman oder KP). Unsere Rechnung übernimmt die Grundstruktur der
Vimshottari-Dasha und wenige Yogas.
