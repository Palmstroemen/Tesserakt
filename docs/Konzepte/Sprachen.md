# Sprachen

Der Apparat spricht die Sprache des Geräts. Es gibt keinen Schalter: Ist die bevorzugte Sprache des Geräts
vorhanden, gilt sie, sonst die nächste in der Liste des Geräts, sonst Deutsch. Die App schickt ihre Sprache mit
jeder Anfrage als `Accept-Language` an den Server; beide wählen aus derselben Liste.

Was in einer Sprache fehlt, kommt aus dem Deutschen. Eine halb fertige Übersetzung zeigt also deutsche Sätze,
keine Lücken (Ausnahme: der Absatz zur Grafik, siehe unten).

## Wo die Texte liegen

| Was | Deutsch (Quelle) | Übersetzung |
|---|---|---|
| Oberfläche der App (Knöpfe, Hinweise, Beschriftungen der Grafiken) | `frontend/src/sprache/de/oberflaeche.json` | `frontend/src/sprache/<sprache>/oberflaeche.json` |
| Vorblatt und Datenverwendung | `frontend/src/sprache/de/*.md` | `frontend/src/sprache/<sprache>/*.md` |
| Leitsatz, Einleitung, Quellen des Buchs | `frontend/src/sprache/de/buchtexte.js` | `frontend/src/sprache/<sprache>/buchtexte.js` |
| Heute, Jahr, Paar, Beschriftungen in den Bilddaten | `docs/Textbausteine/<thema>/<thema>_v1.md` | `docs/Textbausteine/<sprache>/<thema>/<thema>_v1.md`, dann `python3 tools/md_to_heute.py [thema] --sprache <sprache>` |
| Erklärungen (Skill, Methodik, Experiment) | `docs/Textbausteine/erklaerungen/*.md` | `docs/Textbausteine/<sprache>/erklaerungen/*.md`, dann `python3 tools/md_to_erklaerungen.py --sprache <sprache>` |
| Systemtexte (Einführung, Lebensbereiche) | `content/horoscope/de/system_texts_v1.json` (das JSON ist die Quelle) | `content/horoscope/<sprache>/system_texts_v1.json` |
| Fragen der drei Spiele | `backend/fragen*.json` | `content/fragen/<sprache>/fragen*.json`, nur die Texte (Liste: `SICHTBARE_FRAGENTEXTE` in `backend/sprache.py`) |
| Deutungen aus den Regelwerken | `backend/<System>/*.json` | `content/regeln/<sprache>/<System>/*.json`, nur die sichtbaren Felder (Liste: `SICHTBARE_REGELTEXTE`), Schlüssel wie im Original |
| Absatz zur Grafik (Bildtext) | `backend/bildtexte/de.py` | `backend/bildtexte/<sprache>.py` mit denselben Funktionen |
| Städtenamen | `content/orte/de.json` | `content/orte/<sprache>.json` (ohne Datei: die Namen von GeoNames, meist englisch) |

Die Bildtexte setzen Sätze mit Artikeln und Fällen zusammen; dafür schreibt jede Sprache ihr eigenes kleines
Modul. Fehlt es, bleibt der Absatz weg, statt halb deutsch zu erscheinen.

Die Einwilligung hat eine Version (Kopf von `de/einwilligung.md`). Sie gilt für alle Sprachen: Wer den Text
ändert, ändert alle Übersetzungen mit und zählt die Version im deutschen Text hoch.

## Eine neue Sprache freischalten

1. Kürzel (z. B. `en`) in `SPRACHEN` eintragen: `frontend/src/sprache/index.js` und `backend/sprache.py`.
2. `intl.gebiet` in `oberflaeche.json` setzen (Datumsformat, z. B. `en-GB`).
3. Schriften prüfen: Die Handschriften (Caveat, Patrick Hand) enthalten nur lateinische Zeichen.
4. Prüfen: `python3 tools/sprachpruefung.py` (alle Server-Texte kommen aus Sprachdateien) und das Spiel
   einmal mit der neuen Gerätesprache durchspielen.
