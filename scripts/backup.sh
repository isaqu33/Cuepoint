#!/usr/bin/env bash
# Backup do PostgreSQL (formato custom, restaurável com pg_restore) + manifesto de objetos do storage.
# Uso: scripts/backup.sh [pasta-destino]      (padrão: ./backups)
# Variáveis: COMPOSE_FILE (padrão docker-compose.dev.yml), KEEP (quantos backups manter; padrão 14)
set -euo pipefail
cd "$(dirname "$0")/.."
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
DEST="${1:-./backups}"
KEEP="${KEEP:-14}"
mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

OUT="$DEST/cuepoint-$STAMP.dump"
TMP="$OUT.partial"
dc exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$TMP"
[ -s "$TMP" ] || { echo "backup vazio, abortando" >&2; rm -f "$TMP"; exit 1; }
mv "$TMP" "$OUT"   # só aparece como backup depois de completo
echo "banco: $OUT ($(du -h "$OUT" | cut -f1))"

# Manifesto dos objetos (nome, tamanho): permite conferir o storage na restauração.
dc exec -T minio sh -c 'ls -R /data 2>/dev/null | head -2000' > "$DEST/cuepoint-$STAMP.objects.txt" || true

# Mantém só os KEEP mais recentes.
ls -1t "$DEST"/cuepoint-*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do rm -f "$old" "${old%.dump}.objects.txt"; done
echo "ok"
