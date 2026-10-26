# Euer Paar

Bausteine für das Ergebnis von Spiel C (Partnerschaft). Das Backend setzt sie aus den Geburtsdaten beider
Personen zusammen (`POST /horoscope/paar`, `backend/paar.py`). „Du“ ist die erste Person (Gold), „dein
Gegenüber“ die zweite (Silber). Format wie `heute_v1.md`: `## Titel {#gruppe}`, darunter `- schluessel: Text`.
Erzeugen: `python3 tools/md_to_heute.py paar`.

## Westlich: deine Punkte {#westlich_a}

- sonne: Deine Sonne
- mond: Dein Mond
- venus: Deine Venus
- mars: Dein Mars
- aszendent: Dein Aszendent

## Westlich: Punkte deines Gegenübers {#westlich_b}

- sonne: die Sonne deines Gegenübers
- mond: der Mond deines Gegenübers
- venus: die Venus deines Gegenübers
- mars: der Mars deines Gegenübers
- aszendent: der Aszendent deines Gegenübers

## Themen der Punkte {#thema}

- sonne: Wesen
- mond: Gefühl
- venus: Zuneigung
- mars: Begehren
- aszendent: Auftreten

## Themen, wenn beide denselben Punkt meinen {#thema_gemeinsam}

- sonne: eure beiden Naturen
- mond: eure Gefühlswelten
- venus: eure Arten zu lieben
- mars: eure Antriebe
- aszendent: eure Arten aufzutreten

## Westlich: Aspekte zwischen euch {#westlich_aspekt}

Platzhalter {themen}: „Gefühl und Zuneigung“ oder „eure Gefühlswelten“ (immer Plural).

- konjunktion: {a} und {b} stehen in Konjunktion – {themen} verschmelzen; darin erkennt ihr euch sofort.
- trine: {a} und {b} stehen im Trigon – {themen} fließen mühelos ineinander.
- sextil: {a} und {b} stehen im Sextil – {themen} finden leicht zueinander, wenn ihr die Einladung nutzt.
- quadrat: {a} und {b} stehen im Quadrat – {themen} reiben sich aneinander; das hält lebendig, kann aber auch zermürben.
- opposition: {a} und {b} stehen in Opposition – {themen} ziehen sich an wie Gegenpole; Ausgleich ist eure Aufgabe.

## Westlich: ohne enge Aspekte {#westlich_ruhig}

- text: Zwischen euren Sonnen, Monden, Venus und Mars gibt es keine engen Aspekte. Eure Verbindung zeigt sich nicht in einzelnen Funken, sondern im gemeinsamen Alltag, gleichsam im Glutbett.

## Hellenistisch: Zeichen zueinander {#hellenistisch_bezug}

- gleich: {a} und {b} stehen im selben Zeichen – {themen} teilen einen Ort; darin seid ihr euch sehr nah.
- trigon: {a} und {b} stehen in Zeichen desselben Elements (Trigon) – {themen} verstehen sich ohne viele Worte.
- sextil: {a} und {b} stehen im Sextil – die Zeichen sehen sich freundlich an; {themen} kommen leicht ins Gespräch.
- quadrat: {a} und {b} stehen im Quadrat – die Zeichen sehen sich, aber im Widerstreit; {themen} fordern einander heraus.
- opposition: {a} und {b} stehen einander gegenüber – {themen} spiegeln sich; Anziehung und Spannung liegen dicht beieinander.
- aversion: {a} und {b} stehen in Aversion – die Zeichen sehen einander nicht. {Themen} laufen nebeneinander her und begegnen sich nicht von selbst; das braucht bewusste Zuwendung.

## Vedisch: Kutas {#vedisch_kuta}

- tara_gut: Tara (Schicksal), {punkte} von 3: Von Mond-Nakshatra zu Mond-Nakshatra gezählt, landet ihr in beide Richtungen auf günstigen Sternen – ein Zeichen für Wohlergehen und Dauer.
- tara_teil: Tara (Schicksal), {punkte} von 3: Nur in eine Richtung gezählt landet ihr auf einem günstigen Stern – das Glück der Verbindung ist ungleich verteilt.
- tara_schlecht: Tara (Schicksal), {punkte} von 3: In beide Richtungen landet ihr auf Sternen der Gefahr (Vipat, Pratyari oder Naidhana) – das Wohlergehen der Beziehung will bewusst gepflegt werden.
- yoni_gleich: Yoni (Instinkt), 4 von 4: Eure Nakshatras tragen dasselbe Tier, {tier_a} – instinktiv versteht ihr euch.
- yoni_neutral: Yoni (Instinkt), 2 von 4: {tier_a} und {tier_b} sind weder Freunde noch Feinde – Nähe wächst mit der Zeit.
- yoni_feind: Yoni (Instinkt), 0 von 4: {tier_a} und {tier_b} gelten als Erzfeinde – im Instinktiven, auch im Körperlichen, braucht es Rücksicht.
- gana_gleich: Gana (Wesensart), {punkte} von 6: Ihr seid beide {gana_a} – ihr tickt ähnlich.
- gana_nah: Gana (Wesensart), {punkte} von 6: {gana_a} und {gana_b} – verwandte Wesensarten, gut vereinbar.
- gana_fern: Gana (Wesensart), 0 von 6: {gana_a} und {gana_b} – Parashara sieht hier das größte Ehehindernis; die Temperamente prallen aufeinander.
- bhakoot_gut: Bhakoot (Mondzeichen), 7 von 7: Eure Mondzeichen stehen in einem günstigen Abstand – gut für Wohlstand und Gesundheit der Beziehung.
- bhakoot_schlecht: Bhakoot (Mondzeichen), 0 von 7: Eure Mondzeichen stehen im Abstand {abstand} – das gilt als Bhakoot-Dosha; Geld und Gesundheit wollen gemeinsam gehütet werden.
- nadi_gut: Nadi (Konstitution), 8 von 8: {nadi_a} und {nadi_b} – verschiedene Konstitutionen ergänzen sich.
- nadi_schlecht: Nadi (Konstitution), 0 von 8: Ihr teilt dieselbe Nadi ({nadi_a}) – das gilt als Nadi-Dosha, nach der Tradition das schwerste Hindernis; sie rät zu Achtsamkeit bei Gesundheit und Nachwuchs.
- gesamt_sehr_gut: Zusammen {punkte} von {max} Punkten in diesen fünf Kutas – nach der Tradition eine sehr günstige Verbindung.
- gesamt_gut: Zusammen {punkte} von {max} Punkten in diesen fünf Kutas – mehr als die Hälfte; nach der Tradition eine tragfähige Verbindung.
- gesamt_schwierig: Zusammen {punkte} von {max} Punkten in diesen fünf Kutas – weniger als die Hälfte. Die Tradition rät dann, die übrigen Faktoren beider Horoskope genau anzusehen.

## Vedisch: Yoni-Tiere {#yoni_tier}

- pferd: Pferd
- elefant: Elefant
- schaf: Schaf
- schlange: Schlange
- hund: Hund
- katze: Katze
- ratte: Ratte
- kuh: Kuh
- bueffel: Büffel
- tiger: Tiger
- hirsch: Hirsch
- affe: Affe
- mungo: Mungo
- loewe: Löwe

## Vedisch: Ganas {#gana}

- deva: Deva (göttlich)
- manushya: Manushya (menschlich)
- rakshasa: Rakshasa (ungezähmt)

## Chinesisch: Ebenen {#bazi_wer}

- tag: Eure Tageszweige (der Ehepalast)
- jahr: Eure Jahrestiere

## Chinesisch: Zweige zueinander {#bazi_zweig}

- he: {wer}, {a} und {b}, bilden eine Sechser-Kombination (Liu He) und verbinden sich harmonisch. {text}
- sanhe: {wer}, {a} und {b}, gehören zum selben Dreieck ({element}) – ihr zieht am selben Strang.
- chong: {wer}, {a} und {b}, stoßen zusammen (Chong). {text}
- hai: {wer}, {a} und {b}, schaden einander (Liu Hai). {text}
- gleich: {wer} sind gleich, beide {a} – ihr seid euch darin sehr ähnlich, manchmal zu ähnlich.
- neutral: {wer}, {a} und {b}, stehen in keiner besonderen Beziehung – hier ist Raum, den ihr selbst gestaltet.

## Chinesisch: Sechser-Kombinationen {#bazi_he}

- chou_zi: Diese Verbindung gilt als die beständigste der sechs: verlässlich, auf lange Sicht angelegt, gut für alles, was ihr gemeinsam aufbaut.
- hai_yin: Eine schöpferische, idealistische Verbindung mit romantischem Schwung – manchmal ein wenig blauäugig.
- mao_xu: Sie gilt als besonders günstig für Liebe und Ehe: Leidenschaft und gegenseitige Treue.
- chen_you: Eine starke Verbindung für gemeinsame Ziele: Umsicht und Planung tragen euch weit, auch im Materiellen.
- shen_si: Eine kluge, planvolle Verbindung – ihr ergänzt euch im Durchdenken und Umsetzen, wetteifert aber auch gern.
- wei_wu: Leidenschaft und Einfühlung kommen zusammen: eine lebhafte, fröhliche Liebe mit Lust auf Abenteuer.

## Chinesisch: Zusammenstöße {#bazi_chong}

- wu_zi: Wasser trifft auf Feuer: Gefühle schlagen leicht um, Pläne wechseln die Richtung – die Beziehung steht oft unter Druck, bleibt aber in Bewegung.
- chou_wei: Erde stößt auf Erde: Streit um Grundsätzliches, auch ums Geld; manches muss neu geordnet werden.
- shen_yin: Holz trifft auf Metall: viel Energie, aber auch viel Reibung – Auseinandersetzungen liegen nahe.
- mao_you: Holz trifft auf Metall: Sanftheit und Strenge geraten aneinander; dieser Zusammenstoß gilt als einer, der Beziehungen gefährden kann.
- chen_xu: Erde stößt auf Erde: Unruhe rund um Zuhause und Familie, aber auch eine Kraft, die verwandelt.
- hai_si: Feuer trifft auf Wasser: anhaltende Anspannung, die an den Kräften zehrt – und manchmal zu einem Durchbruch führt.

## Chinesisch: Schaden {#bazi_hai}

- wei_zi: Fürsorge wird leicht übersehen, und Missverständnisse entstehen, wo keiner sie will.
- chou_wu: Ungeduld untergräbt leicht, was ihr gemeinsam aufbaut, auch beim Geld.
- si_yin: Hier kann verdeckter Groll wachsen; offene Worte schützen davor.
- chen_mao: Der Wunsch, frei zu gestalten, stößt sich an festen Strukturen.
- hai_shen: Kluge Pläne und hohe Ideale finden schwer zueinander; Erwartungen werden leicht enttäuscht.
- xu_you: Anspruch trifft auf Treue – trotz guter Absichten zermürbt ihr euch leicht gegenseitig.

## Chinesisch: Tagesmeister zueinander {#bazi_dm}

- gleich: Eure Tagesmeister tragen dasselbe Element ({a}) – ihr seid Gefährten, mitunter auch Rivalen.
- naehrt: Der Tagesmeister deines Gegenübers ({b}) nährt deinen ({a}) – du wirst gestärkt und getragen.
- erschoepft: Dein Tagesmeister ({a}) nährt den deines Gegenübers ({b}) – du gibst Kraft, die auch zurückkommen sollte.
- kontrolliert: Der Tagesmeister deines Gegenübers ({b}) kontrolliert deinen ({a}) – das gibt Halt oder übt Druck aus, je nach Maß.
- beherrscht: Dein Tagesmeister ({a}) kontrolliert den deines Gegenübers ({b}) – du gibst Richtung; achte darauf, nicht zu bestimmen.
- stamm_he: Eure Tagesstämme ({sa} und {sb}) bilden eine Stamm-Kombination (He) – klassisch ein starkes Zeichen gegenseitiger Anziehung.

## Arabisch: Firdaria zueinander {#arabisch_firdaria}

- gleich: Ihr steht beide in der Firdaria {a} – dieselben Themen, dasselbe Zeitalter; ihr erlebt diese Jahre im Gleichklang.
- freunde: Du stehst in der Firdaria {a}, dein Gegenüber in der Firdaria {b}. Die beiden Herrscher sind Freunde – eure Lebensphasen stützen einander.
- feinde: Du stehst in der Firdaria {a}, dein Gegenüber in der Firdaria {b}. Die beiden Herrscher sind Feinde – eure Lebensphasen ziehen in verschiedene Richtungen; Verständnis für die Zeit des anderen hilft.
- neutral: Du stehst in der Firdaria {a}, dein Gegenüber in der Firdaria {b}. Die beiden Herrscher sind einander neutral – eure Phasen lassen einander Raum.
- gemischt: Du stehst in der Firdaria {a}, dein Gegenüber in der Firdaria {b}. {sicht_a}, {sicht_b} – die beiden sehen einander nicht gleich; einer trägt in dieser Zeit mehr als der andere.
- knoten: Du stehst in der Firdaria {a}, dein Gegenüber in der Firdaria {b}. Die Mondknoten kennen keine Freundschaften; diese Jahre stehen für sich.

## Arabisch: wie ein Herrscher den anderen sieht {#arabisch_sicht}

- freunde: {x} ist {y} freundlich gesinnt
- feinde: {x} ist {y} feindlich gesinnt
- neutral: {x} steht {y} gleichgültig gegenüber

## Arabisch: Herrscher (wer) {#arabisch_wer}

- sonne: die Sonne
- venus: Venus
- merkur: Merkur
- mond: der Mond
- saturn: Saturn
- jupiter: Jupiter
- mars: Mars

## Arabisch: Herrscher (wem) {#arabisch_wem}

- sonne: der Sonne
- venus: Venus
- merkur: Merkur
- mond: dem Mond
- saturn: Saturn
- jupiter: Jupiter
- mars: Mars

## Arabisch: Lose auf den Punkten des anderen {#arabisch_los}

- glueck_a: Dein Glückslos fällt in das Zeichen {punkt_b} – was dir Glück bringt, berührt dein Gegenüber unmittelbar.
- glueck_b: Das Glückslos deines Gegenübers fällt in das Zeichen {punkt_a_gen} – was deinem Gegenüber Glück bringt, berührt dich unmittelbar.
- keine: Eure Glückslose fallen auf keinen der Hauptpunkte des anderen – euer Glück wächst auf getrennten Feldern.

## Arabisch: Punkte {#arabisch_punkt}

- sonne_b: der Sonne deines Gegenübers
- mond_b: des Mondes deines Gegenübers
- aszendent_b: des Aszendenten deines Gegenübers
- sonne_a: deiner Sonne
- mond_a: deines Mondes
- aszendent_a: deines Aszendenten

## Kabbalah: Sephiroth zueinander {#kabbalah}

- gleich: Ihr teilt dieselbe Sephira, {a} – ihr steht am selben Ort des Lebensbaums und schaut aus derselben Richtung.
- pfad: Deine Sephira {a} und die deines Gegenübers, {b}, sind durch den {nr}. Pfad direkt verbunden: den Buchstaben {buchstabe} ({name} – {bedeutung}). Im Tarot gehört dazu {tarot}.
- saeule: {a} und {b} sind nicht direkt verbunden, stehen aber auf derselben Säule, der {saeule} – ihr strebt in dieselbe Richtung.
- getrennt: {a} und {b} sind nicht direkt verbunden und stehen auf verschiedenen Säulen ({sa} und {sb}) – der Weg zueinander führt über die Mitte des Baums.
- wofuer: Deine Sephira {a}, „{bed_a}“, steht nach der Überlieferung für {tug_a}; die deines Gegenübers, {b}, „{bed_b}“, für {tug_b}.
- wofuer_gleich: {a} heißt „{bed_a}“ und steht nach der Überlieferung für {tug_a}.

## Kabbalah: Säulen {#saeule}

- gnade: Säule der Gnade
- strenge: Säule der Strenge
- mitte: mittleren Säule

## Numerologie {#numerologie}

- lebenszahl: Eure Lebenszahlen {a} und {b}: {erklaerung}
- bewertung: Als Lebenspartnerschaft gilt diese Verbindung als {bewertung}.
- gleiches_jahr: Ihr seid beide im persönlichen Jahr {a} – ihr erlebt dieses Jahr im selben Takt.

## Numerologie: Bewertung {#numerologie_bewertung}

- 1: sehr schwierig
- 2: schwierig
- 3: ausgeglichen
- 4: harmonisch
- 5: sehr harmonisch

## Kleine Wörter {#woerter}

- und: und
- dezimal: ,
- tugend_klein: nein
