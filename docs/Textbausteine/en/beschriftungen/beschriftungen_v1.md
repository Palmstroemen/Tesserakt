# Labels in the Charts

Names the server writes into the chart data (planets, zodiac, calculation steps). The backend inserts them
after the calculation (`backend/beschriftung.py`). Format as for the building blocks: `## Title {#group}`,
below it `- key: Text`. Generate: `python3 tools/md_to_heute.py beschriftungen --sprache en`.

## Planets {#planeten}

- sonne: Sun
- mond: Moon
- merkur: Mercury
- venus: Venus
- mars: Mars
- jupiter: Jupiter
- saturn: Saturn
- uranus: Uranus
- neptun: Neptune
- pluto: Pluto
- nordknoten: North Node
- suedknoten: South Node
- rahu: Rahu
- ketu: Ketu

## Zodiac Signs {#tierkreis}

- aries: Aries
- taurus: Taurus
- gemini: Gemini
- cancer: Cancer
- leo: Leo
- virgo: Virgo
- libra: Libra
- scorpio: Scorpio
- sagittarius: Sagittarius
- capricorn: Capricorn
- aquarius: Aquarius
- pisces: Pisces

## Numerology: Calculation Steps {#numerologie_schritte}

- tag: Day
- monat: Month
- jahr: Year
- quersumme_tag: Digit sum of day
- quersumme_monat: Digit sum of month
- quersumme_jahr: Digit sum of year
- summe: Sum
- lebenspfad: Life Path

## Hellenistic {#hellenistisch}

- haus: House {nr}
