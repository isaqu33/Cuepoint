#!/usr/bin/env bash
# Teste de caos: derruba o worker NO MEIO de uma transcrição e verifica que o job é retomado, termina em READY
# e não duplica a transcrição. Falha (código 1) se qualquer garantia for quebrada.
# Requer a stack de dev no ar, o admin com E2E_PASSWORD (ou APP_SYSTEM_USER_PASSWORD no .env) e um arquivo com
# áudio na biblioteca.     Uso: scripts/chaos-kill-worker.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
BASE="${BASE_URL:-http://localhost:3300}"
JAR="$(mktemp)"; trap 'rm -f "$JAR"' EXIT
dc() { docker compose -f docker-compose.dev.yml "$@"; }
DB="$(dc exec -T db env | grep -E '^POSTGRES_DB=' | cut -d= -f2 | tr -d '\r')"
sql() { dc exec -T db psql -U "$POSTGRES_USER" -d "$DB" -tAc "$1" | tr -d '\r'; }
fail() { echo "FALHOU: $*" >&2; exit 1; }

curl -s -o /dev/null -c "$JAR" -H "Origin: $BASE" --data-urlencode "email=${APP_SYSTEM_USER_EMAIL:-admin@cuepoint.local}" \
  --data-urlencode "password=${E2E_PASSWORD:-$APP_SYSTEM_USER_PASSWORD}" "$BASE/auth/login?/login"
LID="$(sql "select id from \"Lesson\" where audiofile is not null and title not like 'Evento%' order by \"createdAt\" limit 1")"
[ -n "$LID" ] || fail "nenhum arquivo com áudio"
before="$(sql "select count(*) from \"Transcription\" where \"lessonId\"='$LID'")"
status() { sql "select \"transcriptionStatus\" from \"Lesson\" where id='$LID'"; }

# aguarda a fila ficar ociosa
for _ in $(seq 1 60); do [ "$(status)" != PROCESSING ] && [ "$(status)" != QUEUED ] && break; sleep 2; done

code="$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -X POST "$BASE/api/lessons/$LID/transcription")"
[ "$code" = 202 ] || fail "pedido respondeu $code"
for _ in $(seq 1 200); do [ "$(status)" = PROCESSING ] && break; sleep 0.1; done
[ "$(status)" = PROCESSING ] || fail "o job não chegou a PROCESSING"
WORKER="$(dc ps -q worker | head -1)"
docker kill "$WORKER" >/dev/null
echo "worker derrubado com o job em PROCESSING"
sleep 3
[ "$(status)" = PROCESSING ] || fail "estado mudou sem worker: $(status)"
dc up -d worker >/dev/null 2>&1
for _ in $(seq 1 90); do [ "$(status)" = READY ] && break; sleep 2; done
[ "$(status)" = READY ] || fail "o job não foi retomado (estado: $(status))"
after="$(sql "select count(*) from \"Transcription\" where \"lessonId\"='$LID'")"
[ "$after" = 1 ] || fail "transcrições duplicadas: $after"
echo "OK: retomado após queda, READY e $after transcrição (antes: $before)"
