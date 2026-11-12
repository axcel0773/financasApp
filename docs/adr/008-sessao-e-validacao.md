# ADR 008 — Sessão e validação do usuário

Status: aceita (12/11/2026)

## Decisão

O middleware valida a sessão com `supabase.auth.getUser()` (valida o token no servidor do Supabase; `getSession()` não valida) e cada Server Action valida de novo. A RLS é a barreira final.

## Consequências

Há duas idas ao Supabase por requisição de ação. Melhoria planejada: chaves de assinatura assimétricas do Supabase e `getClaims()` (verificação local do token), mantendo `getUser()` só onde o dado do usuário for necessário.
Não há 2FA no login (decisão do dono, 12/11/2026): foi implementado e retirado; o desenho está no commit `9d04ff7`.
