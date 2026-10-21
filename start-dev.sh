#!/usr/bin/env bash
# Startet Backend (FastAPI) und Frontend (Vite) für lokale Entwicklung.
# Beendet vorher laufende Prozesse auf Port 8000 und 5173.
# Nach dem Start: http://localhost:5173 im Browser öffnen.
# Backend-Ausgaben (Uvicorn, print, Tracebacks) gehen in logs/backend.log.
#
# Mit --handy sind Backend und Frontend auch im WLAN erreichbar (Test auf dem Handy):
#   ./start-dev.sh --handy   -> Adresse fuers Handy wird angezeigt

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

HOST_BACKEND="127.0.0.1"
VITE_HOST_ARG=""
if [[ "${1:-}" == "--handy" ]]; then
  HOST_BACKEND="0.0.0.0"
  VITE_HOST_ARG="--host"
fi
cd "$ROOT"

# Laufende Backend- und Frontend-Prozesse auf den Ports beenden
for port in 8000 5173; do
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti ":$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      echo "Beende Prozesse auf Port $port (PIDs: $pids) ..."
      echo "$pids" | xargs kill -9 2>/dev/null || true
      sleep 1
    fi
  elif command -v fuser >/dev/null 2>&1; then
    if fuser "$port/tcp" >/dev/null 2>&1; then
      echo "Beende Prozesse auf Port $port ..."
      fuser -k "$port/tcp" 2>/dev/null || true
      sleep 1
    fi
  fi
done

LOG_DIR="${ROOT}/logs"
BACKEND_LOG="${LOG_DIR}/backend.log"
mkdir -p "$LOG_DIR"

BACKEND_PID=""
cleanup() {
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Backend wird beendet (PID $BACKEND_PID) ..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starte Backend (Port 8000), Log: $BACKEND_LOG"
{
  echo "--- $(date '+%Y-%m-%d %H:%M:%S') Backend gestartet ---"
  (cd backend && python3 -m uvicorn main:app --reload --host "$HOST_BACKEND" --port 8000)
} >> "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Kurz warten, damit das Backend hochfährt
sleep 2

echo "Starte Frontend (Port 5173) ..."
echo ""
echo "  → App im Browser: http://localhost:5173"
echo "  → Schatulle (Prototyp): http://localhost:5173/schatulle.html"
if [[ -n "$VITE_HOST_ARG" ]]; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  echo ""
  echo "  → AUF DEM HANDY (gleiches WLAN): http://${LAN_IP}:5173/schatulle.html"
  echo "    Klappt die Verbindung nicht, blockiert evtl. die Firewall:"
  echo "    sudo ufw allow 5173/tcp && sudo ufw allow 8000/tcp"
fi
echo "  → Backend-Log:    $BACKEND_LOG  (z.B. tail -f logs/backend.log)"
echo "  → Beenden mit Ctrl+C"
echo ""
(cd frontend && npm run dev -- $VITE_HOST_ARG)

cleanup
