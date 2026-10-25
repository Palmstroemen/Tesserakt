// Feste Texte des Horoskopbuchs: Leitsatz (Seite 3), Einleitung (ab Seite 4) und Quellen (am Ende). Die
// Einleitung streift die Kulturen nur, damit sie auch fuer ein Buch mit einem einzigen Horoskop gilt.
// Bausteine wie in Buch.jsx.

export const LEITSATZ = [
  "Sie wussten es nicht.",
  "Aber sie glaubten zu wissen –",
  "und folgten den Sternen gern.",
  "Immer schon.",
];

export const EINLEITUNG = [
  { k: "h2", t: "Von Sternen und Menschen" },
  { k: "h3", t: "Was Horoskope sind" },
  {
    k: "p",
    t: "Ein Horoskop ist eine Momentaufnahme des Himmels – oder des Kalenders – zur Stunde einer Geburt, gelesen nach festen Regeln. Das Wort stammt aus dem Griechischen: hōroskopos, „der die Stunde betrachtet“. Gemeint war ursprünglich der Punkt des Tierkreises, der im Augenblick der Geburt am östlichen Horizont aufsteigt.",
  },
  {
    k: "p",
    t: "Aus diesem einen Augenblick leiten Horoskope Aussagen über einen ganzen Menschen ab: über Neigungen und Begabungen, über Liebe und Arbeit, über gute und schwierige Zeiten. Die Regeln dafür sind alt, oft sehr genau ausgearbeitet und von Tradition zu Tradition verschieden. Gemeinsam ist ihnen die Überzeugung, dass der Anfang etwas über das Ganze verrät.",
  },
  { k: "h3", t: "Was sie waren" },
  {
    k: "p",
    t: "Für die längste Zeit der Geschichte waren Himmelskunde und Sterndeutung dasselbe. Wer den Lauf der Planeten berechnen konnte, war Astronom und Astrologe zugleich. Kalender, Seefahrt und Medizin verdanken dieser Beobachtung des Himmels viel.",
  },
  {
    k: "p",
    t: "Fast jede Hochkultur hat ihre eigene Lesart entwickelt: an den Höfen Mesopotamiens, in den Schulen Alexandrias, an den Tempeln Indiens, in den Kanzleien des chinesischen Kaiserreichs, in den Observatorien von Bagdad und in den Studierstuben der Kabbalisten. Manche lasen die Planeten, manche den Kalender, manche die Zahlen eines Namens. Sie haben voneinander gelernt, einander übersetzt und widersprochen – und sind doch bis heute erstaunlich lebendig geblieben.",
  },
  { k: "h3", t: "Was sie können" },
  {
    k: "p",
    t: "Ein Horoskop gibt eine Sprache für Dinge, die schwer zu benennen sind. Es lädt ein, über sich selbst nachzudenken, über Stärken, Widersprüche und Wünsche. Es kann ein Gespräch eröffnen, mit sich selbst oder mit einem anderen Menschen. Und es verbindet mit einer Überlieferung, die viele Jahrtausende alt ist.",
  },
  {
    k: "p",
    t: "Nicht zuletzt sind Horoskope schön. Ihre Bilder, Tabellen und Kreise zeigen, mit wie viel Sorgfalt Menschen versucht haben, Ordnung in den Himmel und in ihr Leben zu bringen.",
  },
  { k: "h3", t: "Was sie nicht können" },
  {
    k: "p",
    t: "Ob Horoskope mehr treffen, als der Zufall erlaubt, ist eine prüfbare Frage. Wo sie sorgfältig geprüft wurde – etwa in Blindversuchen, in denen Astrologen Persönlichkeitsbeschreibungen den richtigen Geburtsdaten zuordnen sollten –, lagen die Treffer bisher nicht über dem Zufall.",
  },
  {
    k: "p",
    t: "Ein Horoskop kann daher keine Entscheidung abnehmen. Es ersetzt keinen ärztlichen, rechtlichen oder finanziellen Rat und sagt nichts Verlässliches über die Zukunft. Wer es liest, liest am besten mit offenem Herzen und wachem Kopf.",
  },
  { k: "h3", t: "Dieses Buch" },
  {
    k: "p",
    t: "Die Horoskope in diesem Buch wurden nach den überlieferten Regeln ihrer Tradition berechnet – so getreu, wie es die Quellen erlauben. Sie stammen aus dem Tesserakt-Apparat, einem Spiel und zugleich einem Experiment: Jede Antwort hilft, die alte Frage ein wenig genauer zu beantworten, ob die Sterne etwas über uns wissen.",
  },
  {
    k: "schluss",
    t: "Auf jeder Doppelseite steht links die Grafik, rechts der Text dazu. Am Ende des Buchs finden sich die Hintergründe zum Experiment.",
  },
];

// Quellen: dieselben Buecher wie in docs/Berechnungsgrundlagen/quellen.md (dort mit Anmerkungen)
const BUECHER = [
  [
    "Westliche Astrologie",
    [
      "Sepharial (Walter Gorn Old): Astrology. How to Make and Read Your Own Horoscope, 1920",
      "Raphael (Robert Cross Smith): A Manual of Astrology, 1828",
      "Nicholas DeVore: Encyclopedia of Astrology, 1947",
      "Claudius Ptolemäus: Tetrabiblos, 2. Jh. (Übersetzung J. M. Ashmand, 1822)",
    ],
  ],
  [
    "Hellenistische Astrologie",
    [
      "Vettius Valens: Anthologiae, um 160 (Übersetzung Mark Riley)",
      "Claudius Ptolemäus: Tetrabiblos (s. o.)",
      "Dorotheus von Sidon: Carmen Astrologicum, um 75 (Übersetzung David Pingree, 1976)",
      "Paulus Alexandrinus: Introductory Matters, um 378",
      "Julius Firmicus Maternus: Mathesis, um 335",
      "Porphyrios: Einführung in den Tetrabiblos, um 270",
      "Marcus Manilius: Astronomica, um 10",
    ],
  ],
  [
    "Arabische Astrologie",
    [
      "Abu Ma'shar: Introductorium maius, um 850",
      "Al-Biruni: Book of Instruction in the Elements of the Art of Astrology, 1029 (Übersetzung R. Ramsay Wright, 1934)",
      "Sahl ibn Bishr: Introduction to the Science of the Judgments of the Stars, um 820",
      "Guido Bonatti: Liber Astronomiae, um 1277",
      "Masha'allah: On Reception, um 800",
      "Al-Qabisi: Introduction to the Art of Astrology, um 950",
    ],
  ],
  [
    "Vedische Astrologie (Jyotish)",
    [
      "Parashara: Brihat Parashara Hora Shastra (Übersetzung R. Santhanam, 1984)",
      "Mantreswara: Phaladeepika, 13. Jh.",
      "Varahamihira: Brihat Jataka, um 550 (Übersetzung B. Suryanarain Rao, 1905)",
      "Varahamihira: Brihat Samhita, um 550",
      "Kalyana Varma: Saravali, um 800",
      "Vaidyanatha Dikshita: Jataka Parijata, 16. Jh.",
      "Calendar Reform Committee der indischen Regierung: Lahiri-Ayanamsha, 1955",
    ],
  ],
  [
    "Bazi",
    [
      "Joey Yap: Bazi – The Destiny Code",
      "Tong Shu (chinesischer Almanach) und Wan Nian Li (Ewiger Kalender)",
    ],
  ],
  [
    "Numerologie",
    [
      "Cheiro (Louis Hamon): Cheiro's Book of Numbers, 1926",
      "L. Dow Balliett: The Philosophy of Numbers, 1908",
      "W. Wynn Westcott: Numbers. Their Occult Power and Mystic Virtues, 1890",
      "Sepharial: Kabalistic Astrology, 1901",
      "Iamblichos: Über das pythagoreische Leben, um 300",
    ],
  ],
  [
    "Kabbalah",
    [
      "Sefer Jezira (Übersetzung W. Wynn Westcott, 1887)",
      "S. L. MacGregor Mathers: The Kabbalah Unveiled, 1887",
      "Aleister Crowley: 777, 1909",
      "W. Wynn Westcott: Numbers (s. o.)",
      "Papus: The Tarot of the Bohemians, 1892",
      "William Stirling: The Canon, 1897",
      "Sepharial: Kabalistic Astrology (s. o.)",
    ],
  ],
  [
    "Temperamentenlehre",
    [
      "Hippokrates: Über die Natur des Menschen, um 400 v. Chr.",
      "Galen: De temperamentis, 2. Jh.",
      "Avicenna: Canon medicinae, 1025",
      "Ibn Ezra: The Beginning of Wisdom, 1148",
      "Paracelsus: Astronomia magna, 1537",
    ],
  ],
];

export const QUELLEN = [
  { k: "h2", t: "Quellen" },
  {
    k: "p",
    t: "Diese Horoskope wurden sorgfältig und automatisch mit der Software Tesserakt erstellt. Dafür wurden genaue astronomische Berechnungen durchgeführt und die Regeln aus folgenden Büchern akribisch angewandt:",
  },
  ...BUECHER.flatMap(([system, buecher]) => [
    { k: "h3", t: system },
    ...buecher.map((b) => ({ k: "li", t: b })),
  ]),
  {
    k: "klein",
    t: "Astronomische Berechnungen: Swiss Ephemeris (Astrodienst Zürich). Zeitzonen: IANA-Zeitzonendatenbank. Geburtsorte: GeoNames. Die Übertragung der Regeln in Zahlen ist unsere eigene.",
  },
];
