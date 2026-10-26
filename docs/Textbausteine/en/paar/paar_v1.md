# You Two as a Couple

Building blocks for the result of game C (partnership). The backend assembles them from the birth data of
both people (`POST /horoscope/paar`, `backend/paar.py`). "You" is the first person (gold), "your partner"
the second (silver). Format as in `heute_v1.md`: `## Title {#group}`, below it `- key: Text`.
Generate: `python3 tools/md_to_heute.py paar --sprache en`.

## Western: Your Points {#westlich_a}

- sonne: Your Sun
- mond: Your Moon
- venus: Your Venus
- mars: Your Mars
- aszendent: Your Ascendant

## Western: Your Partner's Points {#westlich_b}

- sonne: your partner's Sun
- mond: your partner's Moon
- venus: your partner's Venus
- mars: your partner's Mars
- aszendent: your partner's Ascendant

## Themes of the Points {#thema}

- sonne: essence
- mond: feeling
- venus: affection
- mars: desire
- aszendent: demeanor

## Themes When Both Refer to the Same Point {#thema_gemeinsam}

- sonne: your two natures
- mond: your emotional worlds
- venus: your ways of loving
- mars: your drives
- aszendent: your ways of presenting yourselves

## Western: Aspects Between You {#westlich_aspekt}

Placeholder {themen}: "feeling and affection" or "your emotional worlds" (always plural).

- konjunktion: {a} and {b} are conjunct – {themen} merge; in this you recognize each other at once.
- trine: {a} and {b} are trine – {themen} flow into each other effortlessly.
- sextil: {a} and {b} are sextile – {themen} find each other easily if you two accept the invitation.
- quadrat: {a} and {b} are square – {themen} rub against each other; that keeps things alive, but it can also wear you down.
- opposition: {a} and {b} are in opposition – {themen} attract each other like opposite poles; balance is your task.

## Western: No Close Aspects {#westlich_ruhig}

- text: There are no close aspects between your Suns, Moons, Venuses, and Marses. Your bond shows itself not in single sparks but in your shared everyday life, in the banked embers, as it were.

## Hellenistic: Signs to Each Other {#hellenistisch_bezug}

- gleich: {a} and {b} are in the same sign – {themen} share one place; in this you are very close.
- trigon: {a} and {b} are in signs of the same element (trine) – {themen} understand each other without many words.
- sextil: {a} and {b} are sextile – the signs look upon each other kindly; {themen} easily fall into conversation.
- quadrat: {a} and {b} are square – the signs see each other, but in conflict; {themen} challenge each other.
- opposition: {a} and {b} face each other – {themen} mirror each other; attraction and tension lie close together.
- aversion: {a} and {b} are in aversion – the signs do not see each other. {Themen} run side by side and do not meet on their own; that takes deliberate attention.

## Vedic: Kutas {#vedisch_kuta}

- tara_gut: Tara (destiny), {punkte} of 3: Counting from Moon Nakshatra to Moon Nakshatra, you land on favorable stars in both directions – a sign of well-being and permanence.
- tara_teil: Tara (destiny), {punkte} of 3: Only when counting in one direction do you land on a favorable star – the luck of the bond is unevenly shared.
- tara_schlecht: Tara (destiny), {punkte} of 3: In both directions you land on stars of danger (Vipat, Pratyari, or Naidhana) – the well-being of the relationship needs to be tended deliberately.
- yoni_gleich: Yoni (instinct), 4 of 4: Your Nakshatras carry the same animal, the {tier_a} – you understand each other instinctively.
- yoni_neutral: Yoni (instinct), 2 of 4: The {tier_a} and the {tier_b} are neither friends nor enemies – closeness grows with time.
- yoni_feind: Yoni (instinct), 0 of 4: The {tier_a} and the {tier_b} are considered archenemies – in instinctive matters, physical ones included, consideration is needed.
- gana_gleich: Gana (temperament), {punkte} of 6: You are both {gana_a} – you tick alike.
- gana_nah: Gana (temperament), {punkte} of 6: {gana_a} and {gana_b} – related temperaments, well compatible.
- gana_fern: Gana (temperament), 0 of 6: {gana_a} and {gana_b} – Parashara sees the greatest obstacle to marriage here; the temperaments collide.
- bhakoot_gut: Bhakoot (Moon signs), 7 of 7: Your Moon signs are at a favorable distance – good for the prosperity and health of the relationship.
- bhakoot_schlecht: Bhakoot (Moon signs), 0 of 7: Your Moon signs are at a distance of {abstand} – this is considered Bhakoot Dosha; money and health want to be guarded together.
- nadi_gut: Nadi (constitution), 8 of 8: {nadi_a} and {nadi_b} – different constitutions complement each other.
- nadi_schlecht: Nadi (constitution), 0 of 8: You share the same Nadi ({nadi_a}) – this is considered Nadi Dosha, according to the tradition the most serious obstacle; it advises care with health and offspring.
- gesamt_sehr_gut: In total, {punkte} of {max} points in these five Kutas – according to the tradition a very favorable union.
- gesamt_gut: In total, {punkte} of {max} points in these five Kutas – more than half; according to the tradition a union that can hold.
- gesamt_schwierig: In total, {punkte} of {max} points in these five Kutas – less than half. The tradition then advises looking closely at the other factors of both horoscopes.

## Vedic: Yoni Animals {#yoni_tier}

- pferd: horse
- elefant: elephant
- schaf: sheep
- schlange: serpent
- hund: dog
- katze: cat
- ratte: rat
- kuh: cow
- bueffel: buffalo
- tiger: tiger
- hirsch: deer
- affe: monkey
- mungo: mongoose
- loewe: lion

## Vedic: Ganas {#gana}

- deva: Deva (divine)
- manushya: Manushya (human)
- rakshasa: Rakshasa (untamed)

## Chinese: Levels {#bazi_wer}

- tag: Your day branches (the Spouse Palace)
- jahr: Your year animals

## Chinese: Branches to Each Other {#bazi_zweig}

- he: {wer}, {a} and {b}, form a Six Harmony combination (Liu He) and join harmoniously. {text}
- sanhe: {wer}, {a} and {b}, belong to the same triangle ({element}) – you pull together.
- chong: {wer}, {a} and {b}, clash (Chong). {text}
- hai: {wer}, {a} and {b}, harm each other (Liu Hai). {text}
- gleich: {wer} are the same, both {a} – in this you are very alike, sometimes too alike.
- neutral: {wer}, {a} and {b}, have no special relationship – this is room for the two of you to shape as you like.

## Chinese: Six Combinations {#bazi_he}

- chou_zi: This bond is considered the most steadfast of the six: reliable, built for the long term, good for everything you build together.
- hai_yin: A creative, idealistic bond with romantic momentum – at times a little naive.
- mao_xu: It is considered especially favorable for love and marriage: passion and mutual loyalty.
- chen_you: A strong bond for shared goals: care and planning take you far, in material things too.
- shen_si: A clever, deliberate bond – you complement each other in thinking things through and carrying them out, but you also like to compete.
- wei_wu: Passion and empathy come together: a lively, joyful love with a taste for adventure.

## Chinese: Clashes {#bazi_chong}

- wu_zi: Water meets Fire: feelings shift easily and plans change direction – the relationship is often under pressure, but it stays in motion.
- chou_wei: Earth clashes with Earth: disputes over fundamentals, money included; some things have to be put in a new order.
- shen_yin: Wood meets Metal: plenty of energy, but plenty of friction too – arguments are never far away.
- mao_you: Wood meets Metal: gentleness and severity run into each other; this clash is considered one that can endanger relationships.
- chen_xu: Earth clashes with Earth: unrest around home and family, but also a force that transforms.
- hai_si: Fire meets Water: lasting tension that wears down your strength – and sometimes leads to a breakthrough.

## Chinese: Harms {#bazi_hai}

- wei_zi: Care easily goes unnoticed, and misunderstandings arise where neither of you wants them.
- chou_wu: Impatience can easily undermine what you build together, money included.
- si_yin: Hidden resentment can grow here; open words protect against it.
- chen_mao: The wish to shape things freely runs up against fixed structures.
- hai_shen: Clever plans and high ideals have a hard time meeting; expectations are easily disappointed.
- xu_you: High standards meet loyalty – despite good intentions, you easily wear each other down.

## Chinese: Day Masters to Each Other {#bazi_dm}

- gleich: Your Day Masters carry the same element ({a}) – you are companions, at times also rivals.
- naehrt: Your partner's Day Master ({b}) nourishes yours ({a}) – you are strengthened and supported.
- erschoepft: Your Day Master ({a}) nourishes your partner's ({b}) – you give strength that should also come back to you.
- kontrolliert: Your partner's Day Master ({b}) controls yours ({a}) – that gives you stability or puts pressure on you, depending on the degree.
- beherrscht: Your Day Master ({a}) controls your partner's ({b}) – you give direction; take care not to dictate.
- stamm_he: Your day stems ({sa} and {sb}) form a stem combination (He) – classically a strong sign of mutual attraction.

## Arabic: Firdaria to Each Other {#arabisch_firdaria}

- gleich: You are both in the Firdaria of {a} – the same themes, the same era; you live through these years in unison.
- freunde: You are in the Firdaria of {a}, your partner in the Firdaria of {b}. The two rulers are friends – your phases of life support each other.
- feinde: You are in the Firdaria of {a}, your partner in the Firdaria of {b}. The two rulers are enemies – your phases of life pull in different directions; understanding for the other's time helps.
- neutral: You are in the Firdaria of {a}, your partner in the Firdaria of {b}. The two rulers are neutral toward each other – your phases leave each other room.
- gemischt: You are in the Firdaria of {a}, your partner in the Firdaria of {b}. {sicht_a}, while {sicht_b} – the two do not see each other alike; one of you carries more than the other during this time.
- knoten: You are in the Firdaria of {a}, your partner in the Firdaria of {b}. The lunar nodes know no friendships; these years stand on their own.

## Arabic: How One Ruler Sees the Other {#arabisch_sicht}

- freunde: {x} is friendly toward {y}
- feinde: {x} is hostile toward {y}
- neutral: {x} is indifferent toward {y}

## Arabic: Rulers (Subject) {#arabisch_wer}

- sonne: the Sun
- venus: Venus
- merkur: Mercury
- mond: the Moon
- saturn: Saturn
- jupiter: Jupiter
- mars: Mars

## Arabic: Rulers (Object) {#arabisch_wem}

- sonne: the Sun
- venus: Venus
- merkur: Mercury
- mond: the Moon
- saturn: Saturn
- jupiter: Jupiter
- mars: Mars

## Arabic: Lots on the Other's Points {#arabisch_los}

- glueck_a: Your Lot of Fortune falls in the sign of {punkt_b} – what brings you luck touches your partner directly.
- glueck_b: Your partner's Lot of Fortune falls in the sign of {punkt_a_gen} – what brings your partner luck touches you directly.
- keine: Your Lots of Fortune fall on none of the other's main points – your fortunes grow in separate fields.

## Arabic: Points {#arabisch_punkt}

- sonne_b: your partner's Sun
- mond_b: your partner's Moon
- aszendent_b: your partner's Ascendant
- sonne_a: your Sun
- mond_a: your Moon
- aszendent_a: your Ascendant

## Kabbalah: Sephiroth to Each Other {#kabbalah}

- gleich: You share the same Sephira, {a} – you stand at the same place on the Tree of Life and look out from the same direction.
- pfad: Your Sephira {a} and your partner's, {b}, are directly connected by path {nr}: the letter {buchstabe} ({name} – {bedeutung}). Its tarot card is {tarot}.
- saeule: {a} and {b} are not directly connected, but they stand on the same pillar, the {saeule} – you strive in the same direction.
- getrennt: {a} and {b} are not directly connected and stand on different pillars ({sa} and {sb}) – the way to each other leads through the middle of the tree.
- wofuer: According to tradition, your Sephira {a}, “{bed_a},” stands for {tug_a}; your partner's, {b}, “{bed_b},” for {tug_b}.
- wofuer_gleich: {a} means “{bed_a}” and, according to tradition, stands for {tug_a}.

## Kabbalah: Pillars {#saeule}

- gnade: Pillar of Mercy
- strenge: Pillar of Severity
- mitte: Middle Pillar

## Numerology {#numerologie}

- lebenszahl: Your Life Path numbers {a} and {b}: {erklaerung}
- bewertung: As a life partnership, this union is considered {bewertung}.
- gleiches_jahr: You are both in Personal Year {a} – you experience this year in the same rhythm.

## Numerology: Rating {#numerologie_bewertung}

- 1: very difficult
- 2: difficult
- 3: balanced
- 4: harmonious
- 5: very harmonious

## Small words {#woerter}

- und: and
- dezimal: .
- tugend_klein: ja
