// Fixed texts of the horoscope book in English (translation of de/buchtexte.js): motto (page 3), introduction
// (from page 4) and sources (at the end). Blocks as in Buch.jsx.

export const LEITSATZ = [
  "They did not know.",
  "But they believed they knew –",
  "and gladly followed the stars.",
  "As they always have.",
];

export const EINLEITUNG = [
  { k: "h2", t: "Of Stars and People" },
  { k: "h3", t: "What Horoscopes Are" },
  {
    k: "p",
    t: "A horoscope is a snapshot of the sky – or of the calendar – at the hour of a birth, read according to fixed rules. The word comes from Greek: hōroskopos, “the one who watches the hour.” It originally meant the point of the zodiac rising on the eastern horizon at the moment of birth.",
  },
  {
    k: "p",
    t: "From this one moment, horoscopes derive statements about a whole person: about inclinations and talents, about love and work, about good and difficult times. The rules for this are old, often worked out in great detail and different from tradition to tradition. What they share is the conviction that the beginning reveals something about the whole.",
  },
  { k: "h3", t: "What They Were" },
  {
    k: "p",
    t: "For most of history, astronomy and astrology were one and the same. Whoever could calculate the course of the planets was astronomer and astrologer at once. Calendars, seafaring and medicine owe much to this observation of the sky.",
  },
  {
    k: "p",
    t: "Almost every great civilization developed its own reading: at the courts of Mesopotamia, in the schools of Alexandria, at the temples of India, in the chancelleries of imperial China, in the observatories of Baghdad and in the studies of the Kabbalists. Some read the planets, some the calendar, some the numbers of a name. They learned from one another, translated and contradicted one another – and have remained remarkably alive to this day.",
  },
  { k: "h3", t: "What They Can Do" },
  {
    k: "p",
    t: "A horoscope offers a language for things that are hard to name. It invites you to think about yourself, about strengths, contradictions and wishes. It can open a conversation, with yourself or with another person. And it connects you with a tradition that is many thousands of years old.",
  },
  {
    k: "p",
    t: "Not least, horoscopes are beautiful. Their pictures, tables and circles show how much care people have taken to bring order to the sky and to their lives.",
  },
  { k: "h3", t: "What They Cannot Do" },
  {
    k: "p",
    t: "Whether horoscopes hit the mark more often than chance allows is a testable question. Where it has been carefully tested – for example in blind trials in which astrologers were asked to match personality descriptions to the correct birth data – the hits have so far not been above chance.",
  },
  {
    k: "p",
    t: "A horoscope therefore cannot make a decision for you. It is no substitute for medical, legal or financial advice and says nothing reliable about the future. It is best read with an open heart and a clear head.",
  },
  { k: "h3", t: "This Book" },
  {
    k: "p",
    t: "The horoscopes in this book were calculated according to the traditional rules of their tradition – as faithfully as the sources allow. They come from the Tesserakt Apparatus, a game and an experiment at the same time: every answer helps to settle a little more precisely the old question of whether the stars know something about us.",
  },
  {
    k: "schluss",
    t: "On each double page, the chart is on the left and the text about it on the right. At the end of the book you will find the background to the experiment.",
  },
];

// Sources: the same books as in docs/Berechnungsgrundlagen/quellen.md (with notes there)
const BUECHER = [
  [
    "Western Astrology",
    [
      "Sepharial (Walter Gorn Old): Astrology. How to Make and Read Your Own Horoscope, 1920",
      "Raphael (Robert Cross Smith): A Manual of Astrology, 1828",
      "Nicholas DeVore: Encyclopedia of Astrology, 1947",
      "Claudius Ptolemy: Tetrabiblos, 2nd century (translated by J. M. Ashmand, 1822)",
    ],
  ],
  [
    "Hellenistic Astrology",
    [
      "Vettius Valens: Anthologiae, c. 160 (translated by Mark Riley)",
      "Claudius Ptolemy: Tetrabiblos (see above)",
      "Dorotheus of Sidon: Carmen Astrologicum, c. 75 (translated by David Pingree, 1976)",
      "Paulus Alexandrinus: Introductory Matters, c. 378",
      "Julius Firmicus Maternus: Mathesis, c. 335",
      "Porphyry: Introduction to the Tetrabiblos, c. 270",
      "Marcus Manilius: Astronomica, c. 10",
    ],
  ],
  [
    "Arabic Astrology",
    [
      "Abu Ma'shar: Introductorium maius, c. 850",
      "Al-Biruni: Book of Instruction in the Elements of the Art of Astrology, 1029 (translated by R. Ramsay Wright, 1934)",
      "Sahl ibn Bishr: Introduction to the Science of the Judgments of the Stars, c. 820",
      "Guido Bonatti: Liber Astronomiae, c. 1277",
      "Masha'allah: On Reception, c. 800",
      "Al-Qabisi: Introduction to the Art of Astrology, c. 950",
    ],
  ],
  [
    "Vedic Astrology (Jyotish)",
    [
      "Parashara: Brihat Parashara Hora Shastra (translated by R. Santhanam, 1984)",
      "Mantreswara: Phaladeepika, 13th century",
      "Varahamihira: Brihat Jataka, c. 550 (translated by B. Suryanarain Rao, 1905)",
      "Varahamihira: Brihat Samhita, c. 550",
      "Kalyana Varma: Saravali, c. 800",
      "Vaidyanatha Dikshita: Jataka Parijata, 16th century",
      "Calendar Reform Committee of the Government of India: Lahiri ayanamsha, 1955",
    ],
  ],
  [
    "Bazi",
    [
      "Joey Yap: Bazi – The Destiny Code",
      "Tong Shu (Chinese almanac) and Wan Nian Li (perpetual calendar)",
    ],
  ],
  [
    "Numerology",
    [
      "Cheiro (Louis Hamon): Cheiro's Book of Numbers, 1926",
      "L. Dow Balliett: The Philosophy of Numbers, 1908",
      "W. Wynn Westcott: Numbers. Their Occult Power and Mystic Virtues, 1890",
      "Sepharial: Kabalistic Astrology, 1901",
      "Iamblichus: On the Pythagorean Life, c. 300",
    ],
  ],
  [
    "Kabbalah",
    [
      "Sefer Yetzirah (translated by W. Wynn Westcott, 1887)",
      "S. L. MacGregor Mathers: The Kabbalah Unveiled, 1887",
      "Aleister Crowley: 777, 1909",
      "W. Wynn Westcott: Numbers (see above)",
      "Papus: The Tarot of the Bohemians, 1892",
      "William Stirling: The Canon, 1897",
      "Sepharial: Kabalistic Astrology (see above)",
    ],
  ],
  [
    "Doctrine of the Temperaments",
    [
      "Hippocrates: On the Nature of Man, c. 400 BC",
      "Galen: De temperamentis, 2nd century",
      "Avicenna: Canon medicinae, 1025",
      "Ibn Ezra: The Beginning of Wisdom, 1148",
      "Paracelsus: Astronomia magna, 1537",
    ],
  ],
];

export const QUELLEN = [
  { k: "h2", t: "Sources" },
  {
    k: "p",
    t: "These horoscopes were created carefully and automatically with the Tesserakt software. Precise astronomical calculations were carried out, and the rules from the following books were applied meticulously:",
  },
  ...BUECHER.flatMap(([system, buecher]) => [
    { k: "h3", t: system },
    ...buecher.map((b) => ({ k: "li", t: b })),
  ]),
  {
    k: "klein",
    t: "Astronomical calculations: Swiss Ephemeris (Astrodienst Zurich). Time zones: IANA time zone database. Places of birth: GeoNames. The translation of the rules into numbers is our own.",
  },
  {
    k: "klein",
    t: "The source code of Tesserakt is open; anyone can check how these horoscopes were calculated (server under AGPL-3.0, app under MIT):",
  },
  {
    k: "klein",
    t: "github.com/Palmstroemen/Tesserakt",
  },
];
