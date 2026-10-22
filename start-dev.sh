#!/usr/bin/env bash
# Startet Backend (FastAPI) und Frontend (Vite) für lokale Entwicklung.
# Beendet vorher laufende Prozesse auf Port 8000 und 5173.
# Nach dem Start: http://localhost:5173 im Browser öffnen.
# Backend-Ausgaben (Uvicorn, print, Tracebacks) gehen in logs/backend.log.
#
# Mit --handy ist das Frontend auch im WLAN erreichbar (Test auf dem Handy), per HTTPS mit einem
# selbst signierten Zertifikat (die Kamera verlangt HTTPS). Das Backend wird ueber Vite (/api)
# weitergeleitet. Das Handy zeigt beim ersten Aufruf eine Zertifikatswarnung, die man bestaetigen muss.
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

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [[ -n "$VITE_HOST_ARG" ]]; then
  # Selbst signiertes Zertifikat fuer HTTPS im WLAN (neu, wenn sich die IP geaendert hat)
  ZERT_DIR="${ROOT}/.zertifikat"
  if [[ ! -f "$ZERT_DIR/cert.pem" || "$(cat "$ZERT_DIR/ip" 2>/dev/null)" != "$LAN_IP" ]]; then
    mkdir -p "$ZERT_DIR"
    openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=Tesserakt Entwicklung" \
      -keyout "$ZERT_DIR/key.pem" -out "$ZERT_DIR/cert.pem" \
      -addext "subjectAltName=IP:${LAN_IP},DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1
    echo "$LAN_IP" > "$ZERT_DIR/ip"
  fi
  export TESSERAKT_HTTPS_DIR="$ZERT_DIR"
fi

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
PROTO="http"
[[ -n "$VITE_HOST_ARG" ]] && PROTO="https"
echo "  → Apparat im Browser: ${PROTO}://localhost:5173"
if [[ -n "$VITE_HOST_ARG" ]]; then
  echo ""
  echo "  → AUF DEM HANDY (gleiches WLAN): https://${LAN_IP}:5173"
  echo "    Zertifikatswarnung einmal bestaetigen (selbst signiert)."
  echo "    Klappt die Verbindung nicht, blockiert evtl. die Firewall:"
  echo "    sudo ufw allow 5173/tcp"
fi
echo "  → Backend-Log:    $BACKEND_LOG  (z.B. tail -f logs/backend.log)"
echo "  → Beenden mit Ctrl+C"
echo ""
(cd frontend && npm run dev -- $VITE_HOST_ARG)

cleanup
