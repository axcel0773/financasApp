#!/usr/bin/env bash
# Prepara o ambiente de testes E2E contra o Supabase LOCAL (nunca a produção).
# Uso:  eval "$(bash scripts/e2e-env.sh)"
# Requer `supabase start` já executado. Cria (se faltar) o usuário de teste e imprime os exports.
set -euo pipefail

eval "$(supabase status -o env)"
URL="${API_URL:?supabase status não trouxe API_URL}"
ANON="${ANON_KEY:-${PUBLISHABLE_KEY:?sem chave anon}}"
SERVICE="${SERVICE_ROLE_KEY:-${SECRET_KEY:?sem chave de serviço}}"
case "$URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "Recusado: $URL não é um Supabase local." >&2; exit 1 ;;
esac

E2E_EMAIL="${E2E_EMAIL:-e2e@teste.local}"
E2E_PASSWORD="${E2E_PASSWORD:-senha-de-teste-123}"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$E2E_EMAIL\",\"password\":\"$E2E_PASSWORD\",\"email_confirm\":true}")
case "$code" in
  200|201) echo "Usuário de teste criado." >&2 ;;
  422) echo "Usuário de teste já existia." >&2 ;;
  *) echo "Falha ao criar usuário de teste (HTTP $code)." >&2; exit 1 ;;
esac

cat <<OUT
export NEXT_PUBLIC_SUPABASE_URL='$URL'
export NEXT_PUBLIC_SUPABASE_ANON_KEY='$ANON'
export E2E_EMAIL='$E2E_EMAIL'
export E2E_PASSWORD='$E2E_PASSWORD'
export E2E_LOCAL=1
OUT
