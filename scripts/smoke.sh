#!/usr/bin/env bash
# Teste de fumaça pós-deploy: o essencial responde, a proteção de acesso está de pé e (opcional) o login funciona.
# Uso: scripts/smoke.sh https://app.exemplo.com [email senha]      Sai com código 1 na primeira falha.
set -uo pipefail
BASE="${1:?informe a URL base, ex.: https://app.exemplo.com}"
EMAIL="${2:-}"; PASS="${3:-}"
fail=0
check() { # nome esperado obtido
  if [ "$2" = "$3" ]; then echo "ok    $1"; else echo "FALHA $1 (esperado $2, veio $3)"; fail=1; fi
}
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$@"; }

check "saúde (API + banco)"            200 "$(code "$BASE/api/health")"
check "tela de login no ar"            200 "$(code "$BASE/auth/login")"
check "painel exige login"             302 "$(code "$BASE/admin/lessons")"
check "API administrativa exige login" 401 "$(code "$BASE/api/jobs/x")"
check "token de link inválido: 404"    404 "$(code "$BASE/s/abc")"
check "API desconhecida exige login"   401 "$(code "$BASE/api/nao-existe-$RANDOM")"

if [ -n "$EMAIL" ] && [ -n "$PASS" ]; then
  JAR="$(mktemp)"; trap 'rm -f "$JAR"' EXIT
  curl -s -o /dev/null -c "$JAR" -H "Origin: $BASE" --data-urlencode "email=$EMAIL" --data-urlencode "password=$PASS" "$BASE/auth/login?/login"
  check "login e Biblioteca"           200 "$(code -b "$JAR" "$BASE/app")"
fi
[ "$fail" -eq 0 ] && echo "smoke: tudo certo" || { echo "smoke: FALHOU" >&2; exit 1; }
