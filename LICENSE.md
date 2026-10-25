# Lizenzen

Tesserakt ist quelloffen. Jeder kann nachlesen und nachprüfen, was die App und der Server tun, etwa dass das
Kamerabild das Gerät nie verlässt und nur als Licht im magischen Auge dient. Für die einzelnen Teile gelten
unterschiedliche Lizenzen:

| Teil | Lizenz | Datei |
|---|---|---|
| Server: `backend/` mit Regelwerken, dazu `tools/`, `db/`, `content/`, `archive/` und die Skripte im Hauptordner | GNU Affero General Public License 3.0 (`AGPL-3.0-only`) | [backend/LICENSE](backend/LICENSE) |
| App: `frontend/` (Code) | MIT (`MIT`) | [frontend/LICENSE](frontend/LICENSE) |
| Medien: Bilder und Film der App (z. B. `frontend/src/apparat/kaestchen/`), Gestaltung des Buchs | Creative Commons Namensnennung – Nicht kommerziell 4.0 (`CC-BY-NC-4.0`) | [Lizenztext](https://creativecommons.org/licenses/by-nc/4.0/legalcode.de) |
| Dokumentation: `docs/` | Creative Commons Namensnennung – Nicht kommerziell 4.0 (`CC-BY-NC-4.0`) | [Lizenztext](https://creativecommons.org/licenses/by-nc/4.0/legalcode.de) |
| Schriften: `frontend/src/apparat/schriften/` | SIL Open Font License 1.1 (`OFL-1.1`) | [OFL.txt](frontend/src/apparat/schriften/OFL.txt) |

Copyright © 2026 Oliver Rafelsberger, soweit unten nicht anders angegeben.

## Warum der Server unter AGPL steht

Der Server berechnet die Horoskope mit der Swiss Ephemeris des Astrodienstes (Zürich), die unter der AGPL
steht. Die AGPL verlangt, dass jeder, der den Server über das Netz nutzt, den Quellcode genau der laufenden
Version bekommen kann. Dafür steht dieses Repository; App und Buch verweisen darauf.

Die App enthält keinen Code der Swiss Ephemeris und steht deshalb unter der freieren MIT-Lizenz.

## Fremde Bestandteile

| Was | Von | Lizenz |
|---|---|---|
| Swiss Ephemeris (astronomische Berechnungen) | Astrodienst AG, Zürich | AGPL-3.0 |
| pyswisseph (Python-Anbindung der Swiss Ephemeris) | Stanislas Marquis | AGPL-3.0 |
| Ortsdaten | GeoNames (geonames.org) | CC BY 4.0 |
| Zeitzonen | IANA-Zeitzonendatenbank | gemeinfrei |
| Gebrauchsspuren auf dem Messing (`frontend/src/apparat/oberflaeche/`) | ambientCG (ambientcg.com) | CC0 1.0 |
| Schriften Amiri, Caveat, Cinzel, Ma Shan Zheng, Patrick Hand | siehe [OFL.txt](frontend/src/apparat/schriften/OFL.txt) | OFL-1.1 |
| React, three.js, Capacitor, Vite | ihre Autorinnen und Autoren | MIT |
| FastAPI und weitere Python-Bibliotheken | siehe `backend/requirements.txt` | jeweils eigene Lizenz |

Die Übertragung der Regeln aus den Büchern (siehe Quellenseite im Buch) in Zahlen und Texte ist unsere eigene
Arbeit.

## Der Name „Tesserakt“

Die Lizenzen erlauben, den Code zu verwenden, zu verändern und weiterzugeben. Sie erlauben nicht, den Namen
„Tesserakt“ oder das Aussehen des Apparats für eigene Ausgaben zu verwenden: Wer die App verändert
weitergibt, gibt ihr bitte einen anderen Namen.

## Beiträge

Wer zu diesem Repository beiträgt, stellt seinen Beitrag unter die Lizenz des Teils, zu dem er gehört (siehe
Tabelle oben).
