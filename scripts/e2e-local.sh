#!/usr/bin/env bash
# Roda o E2E completo contra um Supabase LOCAL e descartável (Docker). Não toca na produção.
set -euo pipefail
cd "$(dirname "$0")/.."

supabase start
eval "$(bash scripts/e2e-env.sh)"
npx playwright install chromium
npm run build
npx playwright test "$@"
echo "Pronto. Para desligar o banco local: supabase stop"
