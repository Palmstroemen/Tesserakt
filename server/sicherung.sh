#!/usr/bin/env bash
# Taegliche Sicherung der Forschungsdatenbank: konsistente Kopie aus dem laufenden Backend (SQLite-Backup,
# auch waehrend geschrieben wird), komprimiert nach server/sicherungen/, aeltere als SICHERUNG_TAGE werden
# geloescht, danach per rsync an SICHERUNG_ZIEL (falls gesetzt).
#
# Einrichten (crontab -e auf dem Server):
#   30 3 * * * /pfad/zu/Tesserakt/server/sicherung.sh >> /pfad/zu/Tesserakt/server/sicherungen/log.txt 2>&1

set -euo pipefail
HIER="$(cd "$(dirname "$0")" && pwd)"
cd "$HIER"
set -a; [[ -f .env ]] && . ./.env; set +a

ZIEL_ORDNER="$HIER/sicherungen"
mkdir -p "$ZIEL_ORDNER"
DATEI="forschung-$(date +%F).db"

umask 077
docker compose exec -T backend python -c "
import os, sqlite3, sys, store
quelle = sqlite3.connect(store.DB_PATH)
ziel = sqlite3.connect('/tmp/sicherung.db')
quelle.backup(ziel)
ziel.close()
sys.stdout.buffer.write(open('/tmp/sicherung.db', 'rb').read())
os.remove('/tmp/sicherung.db')
" | gzip > "$ZIEL_ORDNER/$DATEI.gz"

find "$ZIEL_ORDNER" -name 'forschung-*.db.gz' -mtime +"${SICHERUNG_TAGE:-14}" -delete

if [[ -n "${SICHERUNG_ZIEL:-}" ]]; then
  rsync -a "$ZIEL_ORDNER"/forschung-*.db.gz "$SICHERUNG_ZIEL"/
fi
echo "$(date '+%F %T') gesichert: $DATEI.gz"
