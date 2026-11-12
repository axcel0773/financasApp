# ADR 005 — CSP com nonce no middleware

Status: aceita

## Contexto

unsafe-inline em scripts enfraquece a proteção contra XSS.

## Decisão

Nonce por requisição e strict-dynamic no middleware; demais cabeçalhos no next.config.

## Consequências

Páginas são dinâmicas (já eram, por causa da sessão).
