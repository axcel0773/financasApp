# Backup e restauração

O plano gratuito do Supabase não oferece backup recuperável. O workflow `.github/workflows/backup.yml`
gera, toda semana (e sob demanda), um dump do schema `public` (estrutura + todos os dados financeiros),
criptografa com AES-256 e guarda como artefato por 90 dias. O dump também mantém o projeto ativo
(projetos gratuitos pausam após ~7 dias sem uso).

## Configuração (uma vez)

1. **Senha de criptografia aleatória** (o repositório é público; nunca use uma frase memorável):
   `openssl rand -base64 32` — guarde uma cópia no gerenciador de senhas. Sem ela o backup não abre.
2. **String de conexão**: painel do Supabase → Connect → *Session pooler* (a conexão direta é só IPv6 e o GitHub não alcança).
   Troque `[YOUR-PASSWORD]` pela senha do banco.
3. GitHub → Settings → Secrets and variables → Actions → New repository secret:
   - `BACKUP_DB_URL`: a string de conexão
   - `BACKUP_PASSPHRASE`: a senha do passo 1
4. Actions → *Backup do banco* → Run workflow, para testar. Deve terminar verde e gerar o artefato `backup-banco`.

Se o job falhar, o GitHub avisa por e-mail. Agendamentos de repositório público são suspensos após 60 dias
sem nenhuma atividade no repositório; se isso acontecer, rode o workflow manualmente.

## Restaurar

```bash
gpg --batch --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" -o dump.sql -d financas-AAAAMMDD-HHMM.sql.gpg
# banco novo e vazio (por exemplo um novo projeto Supabase, depois de aplicar as migrações de supabase/migrations):
psql "$URL_DO_BANCO_NOVO" -v ON_ERROR_STOP=1 -f dump.sql
```

O dump cobre os dados do app. Usuários de login (`auth.users`) e autenticadores (2FA) não entram:
em um projeto novo, crie o usuário de novo e, se os dados tiverem `user_id`, ajuste-o (`update ... set user_id = '<novo id>'`).
