# Backend fuer den Server. Gebaut vom Hauptordner aus (docker-compose.yml setzt context: ..), weil das Backend
# neben backend/ auch content/ braucht.

# pyswisseph wird aus dem Quellcode gebaut und braucht dafuer einen C-Compiler, der im fertigen Abbild fehlt
FROM python:3.10-slim AS bau
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip wheel --no-cache-dir --wheel-dir /raeder -r /tmp/requirements.txt

FROM python:3.10-slim
RUN useradd --system --uid 10001 --home-dir /app tesserakt && mkdir -p /daten && chown tesserakt /daten
COPY --from=bau /raeder /raeder
RUN pip install --no-cache-dir /raeder/* && rm -rf /raeder

WORKDIR /app
COPY backend/ backend/
COPY content/ content/

USER tesserakt
ENV TESSERAKT_DB=/daten/forschung.db PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app/backend
EXPOSE 8000
# Ohne Zugriffsprotokoll: es enthielte IP-Adressen und Suchbegriffe der Ortssuche (/orte?q=...)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
