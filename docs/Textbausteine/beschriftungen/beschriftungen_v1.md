# Beschriftungen in den Grafiken

Namen, die der Server in die Bilddaten schreibt (Planeten, Tierkreis, Rechenschritte). Das Backend setzt sie
nach der Rechnung ein (`backend/beschriftung.py`). Format wie bei den Textbausteinen: `## Titel {#gruppe}`,
darunter `- schluessel: Text`. Erzeugen: `python3 tools/md_to_heute.py beschriftungen`.

## Planeten {#planeten}

- sonne: Sonne
- mond: Mond
- merkur: Merkur
- venus: Venus
- mars: Mars
- jupiter: Jupiter
- saturn: Saturn
- uranus: Uranus
- neptun: Neptun
- pluto: Pluto
- nordknoten: Nordknoten
- suedknoten: Südknoten
- rahu: Rahu
- ketu: Ketu

## Tierkreiszeichen {#tierkreis}

- aries: Widder
- taurus: Stier
- gemini: Zwillinge
- cancer: Krebs
- leo: Löwe
- virgo: Jungfrau
- libra: Waage
- scorpio: Skorpion
- sagittarius: Schütze
- capricorn: Steinbock
- aquarius: Wassermann
- pisces: Fische

## Numerologie: Rechenschritte {#numerologie_schritte}

- tag: Tag
- monat: Monat
- jahr: Jahr
- quersumme_tag: Quersumme Tag
- quersumme_monat: Quersumme Monat
- quersumme_jahr: Quersumme Jahr
- summe: Summe
- lebenspfad: Lebenspfad

## Hellenistisch {#hellenistisch}

- haus: Haus {nr}
