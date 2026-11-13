# Finanças (PWA pessoal)

App de uso próprio para controlar gastos, renda (holerite), VR/VA, cartão, viagens, metas e investimentos.
Mobile first, instalável no iPhone. Stack: Next.js 15 (App Router) + Supabase (Postgres + Auth) + Vercel, só planos gratuitos.

- Produção: <https://financas-app-orpin-mu.vercel.app> (região `gru1`)
- Banco: projeto Supabase `trtertmjepygwqqtuarx`
- Decisões de arquitetura: [`docs/adr`](docs/adr) · Backup: [`docs/backup.md`](docs/backup.md)

## Rodar localmente

```bash
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (Settings → API)
npm install
npm run dev                  # http://localhost:3000
```

Nunca use a chave `service_role` no app. A segurança vem das políticas RLS do banco (ADR 003).

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run test` | testes unitários (Vitest), hoje só do domínio em `src/core` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (inclui regras de camadas) |
| `npm run arch` | confere as dependências entre camadas (dependency-cruiser) |
| `npm run build` | build de produção |
| `npm run test:e2e` | Playwright (precisa de `E2E_EMAIL`/`E2E_PASSWORD` de um usuário de teste) |
| `npm run audit` | `npm audit` só das dependências de produção |

Antes de publicar: `npm run test && npm run typecheck && npm run arch && npm run build`.

## Banco de dados

Migrações em `supabase/migrations/*.sql`, em ordem. Para aplicar: `supabase db push` ou colar no SQL Editor.
Regras de ouro: toda tabela nova tem `user_id`, RLS ligado e política de dono (ver ADR 003); views usam `security_invoker`.
O teste `supabase/tests/rls.test.sql` (pgTAP, `supabase test db`) confere RLS e isolamento entre usuários, inclusive para viagens, transferências e regras de categoria.
Formato das linhas do banco em `src/infra/supabase/database.types.ts` (atualize após cada migração).

## Estrutura (camadas)

```
src/
  core/         domínio puro e casos de uso, sem framework (dinheiro em centavos, Result<T,E>) — testado
  infra/        Supabase: cliente, repositórios que implementam as portas do core
  composition/  container.ts: único lugar que instancia os repositórios
  app/          rotas do Next, Server Actions finas (`_actions`), middleware de sessão
  features/     blocos de tela por assunto (início, renda, gastos, viagens…)
  ui/           primitivos (botão, cartão, chip), padrões (linha de lançamento) e gráficos
```

Dependências só apontam para dentro (ADR 001), validadas em `npm run arch`.

## Convenções

- Dinheiro sempre em centavos inteiros (ADR 002); formatação só na borda (`ui/format.ts`).
- Nomes: domínio e telas em português; banco, repositórios e infraestrutura em inglês (ADR 007).
- Offline: lançar, editar e excluir entram em fila (IndexedDB) e sincronizam depois (ADR 004).
- CSP com nonce por requisição: toda página é dinâmica (ADR 005).
- Visual: tokens em `src/app/globals.css` e `tailwind.config.ts`; claro e escuro (ADR 010).

## Deploy e operação

- Push na `main` publica na Vercel automaticamente. Só a `main` gera deploy; branches e PRs não geram preview (ADR 009).
- As variáveis do Supabase existem só no ambiente Production da Vercel.
- Backup semanal criptografado por GitHub Actions: [`docs/backup.md`](docs/backup.md).
- O projeto gratuito do Supabase pausa após ~7 dias sem uso; o backup semanal também serve de atividade.
- Commits seguem Conventional Commits (commitlint + husky).

## Testes E2E com Supabase local

Requer Docker e o Supabase CLI. Sobe um banco descartável (aplica `supabase/migrations`), cria um usuário de teste e roda todos os testes, inclusive os autenticados, sem tocar na produção:

```bash
npm run test:e2e:local
supabase stop   # desliga o banco local
```

No CI, o job `build-e2e` faz o mesmo, sem segredos. Os testes de RLS rodam com `supabase test db`.
