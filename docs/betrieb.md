# Betrieb des Servers

Backend und Caddy laufen in Docker (`server/`). Caddy holt das HTTPS-Zertifikat selbst bei Let's Encrypt.
Lokal entwickelt wird weiter ohne Docker (`docs/dev_workflow.md`).

## Was wo liegt

| Datei | Zweck |
|---|---|
| `server/Dockerfile` | Abbild des Backends (backend/ und content/, als eigener Benutzer, ohne Zugriffsprotokoll) |
| `server/docker-compose.yml` | Backend, Caddy, Volumes; die App ist die einzige erlaubte Herkunft (CORS) |
| `server/Caddyfile` | HTTPS, Weiterleitung ans Backend, keine Protokolle mit IP-Adressen |
| `server/.env` | Domain, E-Mail für Let's Encrypt, Sicherungsziel (Vorlage `.env.beispiel`, nicht im Repo) |
| `server/sicherung.sh` | tägliche Sicherung der Forschungsdatenbank |

Die Forschungsdatenbank liegt im Volume `daten` als `forschung.db`. Sie beginnt leer; eine alte
`backend/assessment.db` aus der Entwicklung nicht übernehmen (sie enthält frühere Tabellen mit genauen
Geburtsdaten).

## Datenschutz im Betrieb

- Kein Zugriffsprotokoll, weder im Backend (`--no-access-log`) noch in Caddy; auch Fehlermeldungen zu Anfragen
  werden nicht protokolliert (sie enthielten IP-Adresse und Suchbegriffe der Ortssuche).
- Geburtsdatum, Uhrzeit und Ort werden nur gerechnet, gespeichert wird nach `backend/forschung.py`.
- Sicherungen nur für den eigenen Benutzer lesbar (`chmod 600`).

## Einrichten

Voraussetzungen: ein Linux-Server mit Docker (`docker compose`), die Domain zeigt mit einem A-Eintrag auf seine
öffentliche IPv4, Ports 80 und 443 sind von außen erreichbar (80 braucht Let's Encrypt für das Zertifikat).

```bash
git clone https://github.com/Palmstroemen/Tesserakt.git
cd Tesserakt/server
cp .env.beispiel .env      # DOMAIN, ACME_EMAIL, SICHERUNG_ZIEL eintragen
docker compose up -d --build
curl https://<DOMAIN>/health   # {"status":"ok"}
```

Sicherung täglich um 3:30 (`crontab -e`):

```
30 3 * * * /home/<benutzer>/Tesserakt/server/sicherung.sh >> /home/<benutzer>/Tesserakt/server/sicherungen/log.txt 2>&1
```

Für die Kopie auf die Synology (`SICHERUNG_ZIEL`): auf der Synology SSH und rsync einschalten, den
SSH-Schlüssel des Servers dort hinterlegen; über Tailscale ist sie unter ihrem Tailscale-Namen erreichbar.

## Aktualisieren

Nach der AGPL muss das Repo dem Stand entsprechen, der auf dem Server läuft: nur committete und gepushte
Stände ausrollen.

```bash
cd Tesserakt && git pull
cd server && docker compose up -d --build
```

Ändern sich Regel- oder Fragendateien, ändert sich die Regelversion (`forschung.regelversion()`); Runden mit
verschiedenen Versionen werden getrennt ausgewertet.

## App gegen den Server bauen

```bash
cd frontend && VITE_API_BASE=https://<DOMAIN> npm run android
cd android && JAVA_HOME=~/.local/jdk-21 ./gradlew bundleRelease
```

Ergebnis: `frontend/android/app/build/outputs/bundle/release/app-release.aab` (signiert, wenn
`frontend/android/keystore.properties` vorhanden ist). Vor jedem Upload `versionCode` in
`frontend/android/app/build.gradle` erhöhen.

## Server zu Hause statt gemietet

Geht genauso, zusätzlich: am Router Ports 80 und 443 auf den Server weiterleiten, dem Server im Router eine
feste Adresse geben und die wechselnde öffentliche IP per DynDNS an den DNS-Anbieter melden (je nach Anbieter,
z. B. deSEC oder Cloudflare). Die Domain bleibt dieselbe, wenn der Server später umzieht; die App merkt davon
nichts.
