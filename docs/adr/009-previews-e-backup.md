# ADR 009 — Previews desligados e backup semanal

Status: aceita (12/11/2026)

## Contexto

Previews da Vercel usavam o banco de produção (variáveis cadastradas também para Preview) e o plano gratuito do Supabase não tem backup recuperável.

## Decisão

- Só a `main` gera deploy: `ignoreCommand` em `vercel.json` compara `VERCEL_GIT_COMMIT_REF` com `main` (`VERCEL_ENV` não existe nessa etapa). As variáveis do Supabase ficam só em Production.
- Backup: GitHub Actions semanal (`backup.yml`) faz `pg_dump` do schema `public` pelo Session pooler, criptografa com AES-256 (senha aleatória em segredo) e guarda o artefato por 90 dias. O repositório é público, então a senha precisa ser forte. Guia em `docs/backup.md`.

## Consequências

Sem ambiente de teste na nuvem; testes de integração dependem de um projeto Supabase separado, ainda não criado.
