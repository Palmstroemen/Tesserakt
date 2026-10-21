# Quellen

*Beipackzettel zu Tesserakt. Stand: 21. Oktober 2026.*

Die Regelwerke wurden aus den folgenden Büchern zusammengetragen und in Tendenzen für acht Lebensbereiche
übersetzt. Einzelne Regeln verweisen in den Regeldateien (`backend/<System>/*.json`, Feld `quelle`) oft auf
Kapitel oder Seiten; die Übersetzung in Zahlen ist unsere eigene.

**Neu seit Oktober 2026** (durch die Erweiterungen dazugekommen) ist jeweils markiert.

---

## Westliche Astrologie

- Sepharial (Walter Gorn Old): *Astrology: How to Make and Read Your Own Horoscope*, 1920 (Project Gutenberg #46963)
- Raphael (Robert Cross Smith): *A Manual of Astrology*, 1828
- Nicholas DeVore: *Encyclopedia of Astrology*, 1947
- Claudius Ptolemäus: *Tetrabiblos*, 2. Jh. (Übersetzung J. M. Ashmand, 1822)

## Hellenistische Astrologie

- Vettius Valens: *Anthologiae*, um 160 (Übersetzung Mark Riley)
- Claudius Ptolemäus: *Tetrabiblos* (s. o.)
- Dorotheus von Sidon: *Carmen Astrologicum*, um 75 (Übersetzung David Pingree, 1976)
- Paulus Alexandrinus: *Introductory Matters*, um 378
- Julius Firmicus Maternus: *Mathesis*, um 335
- Porphyrios: *Einführung in den Tetrabiblos*, um 270
- Marcus Manilius: *Astronomica*, um 10

## Arabische Astrologie

- Abu Ma'shar: *Introductorium maius*, um 850
- Al-Biruni: *Book of Instruction in the Elements of the Art of Astrology*, 1029 (Übersetzung R. Ramsay Wright, 1934)
- Sahl ibn Bishr: *Introduction to the Science of the Judgments of the Stars*, um 820
- Guido Bonatti: *Liber Astronomiae*, um 1277
- Masha'allah: *On Reception*, um 800
- Al-Qabisi: *Introduction to the Art of Astrology*, um 950

## Vedische Astrologie (Jyotish)

- Parashara: *Brihat Parashara Hora Shastra* (BPHS) (Übersetzung R. Santhanam, 1984)
- Mantreswara: *Phaladeepika*, 13. Jh.
- Varahamihira: *Brihat Jataka*, um 550 (Übersetzung B. Suryanarain Rao, 1905)
- Varahamihira: *Brihat Samhita*, Kap. 104 (Gochara) – **neu seit Oktober 2026**
- Kalyana Varma: *Saravali*, um 800
- Vaidyanatha Dikshita: *Jataka Parijata*, 16. Jh.
- Lahiri-Ayanamsha: Calendar Reform Committee der indischen Regierung, 1955 (Standard der Ayanamsha) –
  **neu seit Oktober 2026** (vorher unbeabsichtigt Fagan/Bradley)

Durch die Erweiterungen im Oktober 2026 werden aus BPHS zusätzlich die Antardasha-Kapitel und aus
Phaladeepika Kap. 26 (Gochara) genutzt. Die 45 ergänzten Antardasha-Deutungen und die Zuordnung der
Gochara-Planeten zu Lebensbereichen sind unsere Ableitung, nicht Wortlaut der Quelle
(siehe `vedisch.md`).

## Bazi

- Joey Yap: *Bazi – The Destiny Code* (als Systematik)
- Tong Shu (chinesischer Almanach) und Wan Nian Li (Ewiger Kalender) als Tradition
- Sonnenmonate und Lichun (Sonnenlänge 315°) sowie die Regeln der Fünf Tiger und Fünf Ratten:
  allgemeiner Kalenderstandard der Bazi-Tradition – **für die Rechnung neu seit Oktober 2026**
  (vorher Kalendermonate)

## Numerologie

- Cheiro (Louis Hamon): *Cheiro's Book of Numbers*, 1926
- L. Dow Balliett: *The Philosophy of Numbers*, 1908
- W. Wynn Westcott: *Numbers: Their Occult Power and Mystic Virtues*, 1890
- Sepharial: *Kabalistic Astrology*, 1901
- Iamblichos: *Über das pythagoreische Leben*, um 300

## Kabbalah

- *Sefer Jezira* (Übersetzung W. Wynn Westcott, 1887)
- S. L. MacGregor Mathers: *The Kabbalah Unveiled*, 1887
- Aleister Crowley: *777*, 1909
- W. Wynn Westcott: *Numbers* (s. o.)
- Papus: *The Tarot of the Bohemians*, 1892
- William Stirling: *The Canon*, 1897
- Sepharial: *Kabalistic Astrology* (s. o.)

## Temperamentenlehre (Paracelsus-Profil)

- Hippokrates: *Über die Natur des Menschen*, um 400 v. Chr.
- Galen: *De temperamentis*, 2. Jh.
- Avicenna: *Canon medicinae*, 1025
- Ibn Ezra: *The Beginning of Wisdom*, 1148
- Paracelsus: *Astronomia magna*, 1537

---

## Technische Grundlagen

- **Swiss Ephemeris** (Astrodienst Zürich) über `pyswisseph`: Planetenpositionen, Häuser, Ayanamsha
- **IANA-Zeitzonendatenbank** über Python `zoneinfo`: Zeitzonen und historische Sommerzeit –
  **neu seit Oktober 2026**
- **GeoNames** (CC BY 4.0) über `geonamescache`: Geburtsorte mit Koordinaten und Zeitzonen –
  **neu seit Oktober 2026**
- **Ma Shan Zheng** (Pinselschrift, SIL Open Font License 1.1, The Ma Shan Zheng Project Authors): für die
  Bazi-Grafik, auf die benötigten Zeichen zugeschnitten (`frontend/src/schatulle/schriften/`) –
  **neu seit Oktober 2026**

## Vorbilder für die Grafiken

- Bazi: rote Bazi-Karten mit den acht Zeichen in Tusche, z. B. National Museum of Singapore, Familienreihe
  1922–1931 (Acc. No. 2011-03153), und Verlobungskarten (庚帖); Säulen senkrecht, von rechts nach links

## Hinweise

- Mehrere Regeldateien bezeichnen ihre Quellen als „public domain“. Für alte Originaltexte und alte
  Übersetzungen (z. B. Ashmand 1822, Westcott 1887) trifft das zu, für neuere Übersetzungen (z. B.
  Santhanam 1984, Riley, Pingree 1976) und für DeVore (1947) und Joey Yap vermutlich nicht.
  Tesserakt übernimmt keine Texte, sondern übersetzt Aussagen in Zahlen; die Angabe „public domain“ in den
  Dateien sollte trotzdem korrigiert werden. Keine Rechtsberatung.
- Lizenz der Swiss Ephemeris: AGPL oder kommerzielle Lizenz von Astrodienst. Für einen öffentlichen
  Betrieb muss das geklärt werden.
