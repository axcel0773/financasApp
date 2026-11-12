# ADR 004 — Offline com fila e service worker próprio

Status: aceita

## Contexto

Registrar gasto sem sinal deve funcionar, sem guardar dados financeiros em cache.

## Decisão

Service worker guarda só arquivos estáticos e a página de novo gasto; gastos pendentes ficam em IndexedDB e sincronizam com client_id idempotente. Logout limpa tudo. Serwist foi dispensado.

## Consequências

Manutenção manual do sw.js; menos dependências.
