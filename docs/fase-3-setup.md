# Fase 3 — Setup do Supabase (passos manuais)

O código da Fase 3 (Prisma schema, auth, RLS, telas) já está pronto. Estes
passos dependem de credenciais reais e precisam ser feitos por você uma vez.

## 1. Criar o projeto Supabase

1. Em <https://supabase.com/dashboard>, crie um projeto (região mais próxima:
   `sa-east-1` / São Paulo). Anote a **Database password**.
2. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
3. Em **Project Settings → Database → Connection string → Prisma**, copie as
   strings do **pooler (6543)** e **direta (5432)**.

## 2. Preencher o `.env.local`

```bash
cp .env.example .env.local
```

Preencha `NEXT_PUBLIC_SITE_URL`, as chaves do Supabase, e:

- `DATABASE_URL` → pooler, porta **6543**, com `?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` → conexão direta, porta **5432**

> A senha do banco precisa estar **URL-encoded** (ex.: `@` → `%40`).

## 3. Criar as tabelas (migration)

```bash
npm run db:migrate -- --name init   # prisma migrate dev (usa DIRECT_URL)
npm run db:seed                      # popula cursos/instrutores de constants.ts
```

Em produção/Coolify use `npm run db:deploy` (prisma migrate deploy).

## 4. Aplicar o RLS

No **SQL Editor** do Supabase, cole e rode o conteúdo de
[`prisma/rls.sql`](../prisma/rls.sql). (Defesa em profundidade — o app acessa via
Prisma server-side; a regra de acesso a conteúdo é aplicada por código.)

## 5. Configurar a Auth

1. **Authentication → URL Configuration**: defina o **Site URL** e adicione as
   **Redirect URLs**: `http://localhost:3000/auth/callback` e a de produção
   `https://SEU_DOMINIO/auth/callback`.
2. **Authentication → Providers → Email**: habilitado (confirmação de e-mail
   recomendada em produção; pode desativar em dev para testar rápido).
3. **Authentication → Providers → Google**: habilite e informe
   `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` (criados no Google
   Cloud Console, com o redirect `https://<projeto>.supabase.co/auth/v1/callback`).

## 6. Promover um admin

O primeiro usuário nasce como `student`. Para virar admin, no SQL Editor:

```sql
update "User" set role = 'admin' where email = 'voce@exemplo.com';
```

## Pronto

`npm run dev` → teste `/cadastro`, `/login`, `/recuperar-senha`. As áreas
`/aprender` e `/admin` (Fases 5 e 6) já estão protegidas pelo middleware.

### Nota de deploy (Coolify + Prisma standalone)
Com `output: 'standalone'`, garanta que o engine do Prisma vá junto. O
`postinstall`/`build` já roda `prisma generate`; rode `npm run db:deploy` no
passo de deploy (antes de subir o container ou como release command).
