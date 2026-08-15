# Build multi-étapes : les outils de compilation restent dans la première
# image et n'alourdissent pas celle qui tourne en production.

FROM python:3.12-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Aucune dépendance système : toutes les roues du projet sont
# précompilées pour Python 3.12 (vérifié au build local).
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r requirements.txt


# ─────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# Utilisateur non privilégié : un conteneur qui tourne en root est une
# escalade offerte si l'application est compromise.
RUN groupadd -r sakalava && useradd -r -g sakalava sakalava

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=sakalava:sakalava src ./src
COPY --chown=sakalava:sakalava alembic ./alembic
COPY --chown=sakalava:sakalava alembic.ini ./

USER sakalava

EXPOSE 8000

# Sonde interne : Docker et Traefik s'en servent pour savoir si le
# conteneur est réellement prêt, pas seulement démarré.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

# 2 workers pour 4 vCPU partagés avec Odoo. Monter à 4 priverait les
# autres services de la machine.
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
