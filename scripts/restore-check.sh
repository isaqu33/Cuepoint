#!/usr/bin/env bash
# Prova que o backup restaura: sobe um Postgres ISOLADO e descartável, restaura o dump mais recente e compara
# a contagem de linhas das tabelas principais com o banco em uso. Não toca no banco real.
# Uso: scripts/restore-check.sh [arquivo.dump]        (padrão: o mais recente em ./backups)
set -euo pipefail
cd "$(dirname "$0")/.."
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
DUMP="${1:-$(ls -1t ./backups/cuepoint-*.dump 2>/dev/null | head -1)}"
[ -f "$DUMP" ] || { echo "nenhum backup encontrado" >&2; exit 2; }
dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
NAME="cuepoint-restore-check-$$"
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=restore -e POSTGRES_DB=restore postgres:16-alpine >/dev/null
for _ in $(seq 1 30); do docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
docker cp "$DUMP" "$NAME:/tmp/restore.dump"
docker exec "$NAME" pg_restore -U postgres -d restore --no-owner --exit-on-error /tmp/restore.dump

TABLES=(User Lesson Transcription EventLog Course Serie File)
status=0
for t in "${TABLES[@]}"; do
  restored="$(docker exec "$NAME" psql -U postgres -d restore -tAc "SELECT count(*) FROM \"$t\"" | tr -d '\r')"
  live="$(dc exec -T db sh -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -tAc 'SELECT count(*) FROM \"$t\"'" | tr -d '\r')"
  mark="ok"
  # O banco em uso pode ter recebido linhas depois do backup: restaurado > vivo é erro; menor é aceitável.
  [ "$restored" -le "$live" ] || { mark="DIVERGENTE"; status=1; }
  printf '%-14s restaurado=%-6s em-uso=%-6s %s\n' "$t" "$restored" "$live" "$mark"
done
[ "$status" -eq 0 ] && echo "restauração verificada: $DUMP" || echo "FALHA na verificação" >&2
exit "$status"
