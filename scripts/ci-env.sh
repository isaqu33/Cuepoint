#!/usr/bin/env bash
# Gera um .env descartável para CI/E2E a partir do .env.example, com segredos aleatórios (nunca reutilize em produção).
set -euo pipefail
cd "$(dirname "$0")/.."
rand() { head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24; }
cp .env.example .env
sed -i.bak \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(rand)|" \
  -e "s|^MINIO_SECRET_KEY=.*|MINIO_SECRET_KEY=$(rand)|" \
  -e "s|^APP_JWT_SECRET_KEY=.*|APP_JWT_SECRET_KEY=$(rand)|" \
  -e "s|^APP_SYSTEM_USER_PASSWORD=.*|APP_SYSTEM_USER_PASSWORD=$(rand)|" .env
rm -f .env.bak
mkdir -p backups
echo "ok: .env gerado"
