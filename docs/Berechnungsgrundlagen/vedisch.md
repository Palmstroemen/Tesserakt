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
- **Antardasha (Bhukti):** Unterperiode der laufenden Mahadasha, beginnend mit dem Mahadasha-Herrscher in
  Vimshottari-Reihenfolge; Dauer = Mahadasha-Jahre × Antardasha-Jahre / 120. Eigene Regelebene (Gewicht 0,6).
- **Gochara (Transite):** Haus jedes laufenden Planeten (Sonne, Mars, Merkur, Jupiter, Venus, Saturn,
  Rahu, Ketu; Rahu als mittlerer Mondknoten), gezählt in ganzen Zeichen vom siderischen Zeichen des
  Geburtsmondes. Günstig nach der klassischen Tabelle (Phaladeepika Kap. 26): Sonne 3/6/10/11; Mars,
  Saturn, Rahu, Ketu 3/6/11; Merkur 2/4/6/8/10/11; Jupiter 2/5/7/9/11; Venus 1/2/3/4/5/8/9/11/12; sonst
  ungünstig. Saturn im 12., 1. oder 2. Haus = **Sade Sati** (eigene Regel). Eigene Regelebene (Gewicht 0,5).
- **Yogas:** einfache Raja-Yogas aus der Stellung der Hausherrscher (ganze Zeichen ab dem siderischen
  Aszendenten).
- **Quellen der Regeln:** Parashara (BPHS), Mantreswara (Phaladeepika).

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Lebensalter als Differenz der Jahreszahlen; die Dasha-Position sprang am 1. Januar. | Alter mit Nachkommastellen (Commit `fa8f7e3`). |
| 20.10.2026 | **Ayanamsha:** Der Code-Kommentar nannte Lahiri, tatsächlich galt die Voreinstellung der Swiss Ephemeris, **Fagan/Bradley** (etwa 0,9° mehr). Nahe den Nakshatra-Grenzen ergab das ein falsches Geburts-Nakshatra und damit einen falschen Dasha-Beginn. | Lahiri ausdrücklich gesetzt. |
| 20.10.2026 | **Yogas** wurden mit **tropischen** Zeichen bestimmt, rund 24° neben den siderischen. | Siderische Zeichen für Aszendent und Planeten. |
| 21.10.2026 | Die **Antardasha** wurde nicht verwendet; die Regeldaten enthielten nur 4 von 9 Hauptperioden. | Matrix auf alle 81 Kombinationen ergänzt und als Regelebene eingebaut (siehe unten). |
| 21.10.2026 | **Gochara** fehlte ganz (keine Regeln). | Klassische Tabelle der günstigen Häuser und Sade Sati als Regelebene ergänzt. |
| 21.10.2026 | Die Dasha-Grafik zeigte die Perioden als Positionen im 120-Jahre-Zyklus ab Ketu, nicht als Lebensalter (z. B. „Saturn 84–103 Jahre“ bei einer 41-Jährigen); die Liste begann bei allen mit Ketu. Die Wertung nutzte schon immer den richtigen Planeten. | Perioden in Lebensjahren ab der Geburt, beginnend mit dem Rest der Geburts-Dasha. |

## Bekannte Vereinfachungen

- **45 der 81 Antardasha-Deutungen stammen von uns.** Die Regeldaten enthielten nur die Zeilen für Ketu,
  Venus, Jupiter und Saturn. Die Zeilen für Sonne, Mond, Mars, Rahu und Merkur haben wir im Oktober 2026
  nach den Grundzügen der Antardasha-Kapitel in BPHS ergänzt und mit den vorhandenen Einträgen abgestimmt
  (z. B. gleiche Einschätzung von Saturn–Mars und Mars–Saturn). Sie sind in `jyotish_dasha.json` mit dem Feld
  `ergaenzt` gekennzeichnet und **nicht** wörtlich aus der Quelle übernommen. Die Vektoren gehen vom Mittel
  der beiden Mahadasha-Profile aus und betonen die in der Deutung genannten Bereiche – so wie die
  vorhandenen Einträge, die ebenfalls von Hand gesetzt sind.
- In BPHS hängt das Ergebnis einer Antardasha stark von Haus und Würde beider Herrscher im Geburtshoroskop
  ab. Unsere Matrix kennt nur die Kombination der beiden Planeten.
- Keine Pratyantardasha (dritte Ebene).
- **Gochara vereinfacht:** keine **Vedha** (Aufhebung eines günstigen Transits durch einen Planeten in einem
  bestimmten Gegenhaus), kein Ashtakavarga, kein laufender Mond. Die betroffenen Lebensbereiche je Planet
  haben wir aus den klassischen Bedeutungen (Karakatva) abgeleitet; günstig = 0,75, ungünstig = 0,25 in
  diesen Bereichen. Die Tabelle der günstigen Häuser selbst ist klassisch.
- Nur ein kleiner Teil der Yogas; keine Divisionalhoroskope (Navamsa usw.), keine Shadbala.
- Ohne Geburtsort sind Aszendent und Yogas ungenau (`00_allgemein.md`); das Nakshatra kaum (der Mond
  wandert etwa 0,5° pro Stunde, ein Nakshatra umfasst 13°20').
- Ohne Ephemeris (z. B. in Tests) fällt das Nakshatra auf eine grobe Schätzung aus dem Tag des Jahres
  zurück. Im Spiel steht die Ephemeris immer zur Verfügung.

## Jahreshoroskop (Ausblick auf 12 Monate)

`backend/ausblick.py`, Endpunkt `POST /horoscope/ausblick`. Für jeden Tag der nächsten 365 Tage:

- **Dasha:** Mahadasha und Antardasha aus der Position im 120-Jahre-Zyklus (Geburtsposition aus dem
  Mond-Nakshatra plus Lebensalter). Antardasha-Dauer = MD-Jahre × AD-Jahre / 120, beginnend mit dem Lord der
  Mahadasha (BPHS Kap. 48). Jede Unterperiode im Jahr wird mit ihrer Deutung aus der Antardasha-Matrix
  genannt; beginnt eine neue Mahadasha, steht das als eigenes Ereignis da.
- **Gochara:** siderisches Zeichen (Lahiri) von Jupiter und Saturn, Haus vom Zeichen des Geburtsmondes,
  günstig/ungünstig nach derselben Tabelle wie oben. Jedes Haus wird einmal genannt; eine rückläufige
  Rückkehr ins vorige Haus steht als Nachsatz dabei. Saturn im 12., 1. und 2. Haus: Beginn, Kern und
  Ausklang der Sade Sati; der Wechsel vom 2. ins 3. Haus als ihr Ende.
- Vereinfachungen wie oben (kein Vedha, kein Ashtakavarga); Rahu/Ketu und die schnellen Planeten fehlen
  im Ausblick, Pratyantardashas (dritte Ebene) ebenfalls.

## Partnerschaft (Ergebnis von Spiel C)

`backend/paar.py`, Endpunkt `POST /horoscope/paar`. Fünf der acht Kutas (Ashtakoota) aus den Mond-Nakshatras und siderischen Mondzeichen, zusammen
28 Punkte: Tara (3), Yoni (4), Gana (6), Bhakoot (7), Nadi (8). Bewertung: ab drei Vierteln sehr
günstig, ab der Hälfte günstig (nach Parasharas Halbe-Punkte-Regel), sonst schwierig. Vereinfachungen:
Yoni nur gleich (4), neutral (2) oder Erzfeinde (0), ohne die Abstufung befreundet/feindlich; Stri Dirgha
und Vashya fehlen (Stri Dirgha bräuchte das Geschlecht, der Apparat fragt es nicht ab); keine
Aufhebung von Doshas.

Abweichungen von `jyotish_nakshatras.json` (die Daten sind dort in diesen Punkten falsch):
- **Tara:** ungünstig sind die Reste 3, 5, 7 (Vipat, Pratyari, Naidhana), nicht alle geraden Zahlen.
- **Yoni:** übliche Tabelle; die Datei ordnet Uttara Ashadha und Shravana falsch zu (richtig: Mungo und Affe).
- **Nadi:** festes Zickzack Adi–Madhya–Antya–Antya–Madhya–Adi; die Datei weicht bei Magha, Hasta und Mula ab.

## Was ein erfahrener Jyotishi anders macht

Er liest Dasha und Antardasha zusammen mit Gochara und den Divisionalhoroskopen, beurteilt die Stärke
der Planeten (Shadbala) und kennt Hunderte Yogas. Viele würden zudem die Ayanamsha-Wahl begründen oder
eine andere bevorzugen (z. B. Raman oder KP). Unsere Rechnung übernimmt die Grundstruktur der
Vimshottari-Dasha und wenige Yogas.
