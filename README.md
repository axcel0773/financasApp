# Finanças (PWA pessoal)

Next.js + Supabase + Vercel. Veja `PLANO_IMPLEMENTACAO.md` para a arquitetura.

```bash
cp .env.example .env.local   # preencha as chaves do Supabase
npm install
npm run test && npm run typecheck && npm run dev
```

Aplicar a migration: `supabase db push` (ou cole `supabase/migrations/*.sql` no SQL Editor).
Adicione ícones `public/icon-192.png` e `public/icon-512.png`.
