# CG Educacional — LMS

Plataforma de ensino da **CG Educacional** (instituição brasileira: neurociência, educação inclusiva, formação de professores, EJA, graduação/pós). Site institucional + LMS completo: vitrine pública de cursos, checkout, área do aluno, painel admin/professor e certificados.

- Produção: **https://cgeducacional.com.br** (e `www.`)
- Repo: `github.com/matheusabdala/cgeducacional-site`
- **Branch de trabalho/deploy: `feat/nextjs-migration`** — é ela que o Coolify publica. A `main` só tem o site Vite antigo ("first commit") e não é usada.
- Projeto irmão: **Certimaker** (`../certimaker`, https://certimaker.cgeducacional.com.br) — emissor de certificados consumido via API.

## Comandos

```bash
npm install          # postinstall roda `prisma generate`; prepare liga .githooks
npm run dev          # Next dev em http://localhost:3000
npm run build        # prisma generate && next build
npm run lint
npm run db:migrate   # prisma migrate dev (cria migration nova — usa DIRECT_URL)
npm run db:deploy    # prisma migrate deploy
npm run db:seed      # tsx prisma/seed.ts (dados demo)
npm run db:studio
npx tsx prisma/import-catalog.ts   # importa o catálogo de 260 cursos (idempotente)
node scripts/shots.mjs             # screenshots via Playwright (SHOT_BASE, SHOT_PAGES, SHOT_OUT)
```

- Node **22** (mesma versão do Dockerfile).
- Não há suíte de testes ainda. Verificação = `npm run build` + testar no navegador.
- Env local em **`.env.local`** (modelo em `.env.example`). `lib/env.ts` lança erro se faltar `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` — o app nem sobe sem elas (o middleware usa em toda request). As demais são lidas sob demanda (`serverEnv.x()`), então só quebram a feature que as usa.
- ⚠️ **Não existe banco de dev separado**: `DATABASE_URL` aponta pro Supabase de produção. Cuidado com `db:migrate`, seed e testes de escrita.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 15** (App Router, Server Components, Server Actions), React 19, TypeScript (`strict: false`) |
| Auth | **Supabase Auth** (email/senha + OAuth Google) via `@supabase/ssr` (cookies) |
| Banco | **Postgres do Supabase** via **Prisma 6** (pooler 6543 em runtime, `DIRECT_URL` 5432 p/ migrations). RLS em `prisma/rls.sql` é defesa em profundidade — o app acessa só via Prisma server-side |
| UI | **shadcn/ui** (Radix) + Tailwind 3 + `next-themes` (claro padrão / escuro), fonte Inter, ícones `lucide-react`, toasts `sonner` |
| Forms | react-hook-form + Zod 4 |
| Mídia | **Google Drive** (Service Account) para vídeo/PDF/material; YouTube unlisted opcional. Player **Plyr** |
| Pagamentos | **Mercado Pago** checkout transparente (PIX + cartão) |
| Certificados | **Certimaker** (API Bearer + SSO) |
| E-mail | **Resend** via HTTP (degrada sem `RESEND_API_KEY`) |
| IA | **Gemini** `gemini-2.5-flash` via REST (gerador de rascunho de curso no admin) |
| Deploy | **Coolify** self-hosted (`http://161.97.136.40:8000`), Dockerfile, `output: "standalone"` |

## Estrutura

```
app/
  (marketing)/      landing pública: /, /cursos, /cursos/[id], /eja, /graduacao,
                    /pos-graduacao, /validar-certificado
  (auth)/           /login, /cadastro, /recuperar-senha + actions.ts
  auth/callback/    callback OAuth do Supabase
  aprender/         área do aluno: dashboard, /[slug] (curso), /[slug]/[lessonId] (aula)
  admin/            painel admin/professor: dashboard, cursos (+ builder), alunos, compras
  checkout/[courseId]/  checkout Mercado Pago
  api/              só HTTP cru: health, video, material, certificate, admin/upload, payments/webhook
components/
  ui/               shadcn (não reinventar)
  admin/ auth/ checkout/ learn/ player/   componentes por área
  *.tsx (raiz)      páginas/blocos da landing portados do site Vite (HomePage, Header, Footer...)
lib/                auth, access (gate de aula), learn (drip/sequencial), catalog, env, prisma,
                    supabase/{client,server}, validations/, rate-limit, cpf, card, pricing
server/             integrações server-only: media/ (Drive, YouTube), certimaker/, payments/
                    (mercadopago, orders), email/, gemini/
prisma/             schema, migrations (0_init … 7_course_categories), rls.sql, seeds,
                    import-catalog.ts + data/catalog-courses.json
constants.ts, types.ts   legado do Vite (tipos da vitrine, WhatsApp link)
docs/api.md         referência VIVA da API (ver regra abaixo)
tasks.md            roadmap por fases com status
```

## Domínio (Prisma)

`User` (id = `auth.users.id`, `role`: student | instructor | admin, `cpf` único) · `Course` (slug, categoria, preço, dados acadêmicos p/ certificado, opções `requireSequential` e drip, ids cacheados do Certimaker) → `Module` → `Lesson` (`videoProvider` + `videoRef`, `content` texto, `documentFileId` PDF inline, `materialFileId` download) · `Enrollment` · `LessonProgress` · `Certificate` (code + URL do Certimaker) · `Order` (status initiated→pending→approved…, `mpPaymentId`).

## Fluxos principais

- **Auth:** `middleware.ts` renova sessão e exige login em `/aprender` e `/admin`. Role é checado server-side nos layouts com `requireRole([...])` (`lib/auth.ts`). `ensureProfile` cria a linha em `public.User` no cadastro/OAuth. CPF obrigatório.
- **Acesso a conteúdo:** toda rota que serve bytes de aula passa por `getLessonForUser()` (`lib/access.ts`) → matrícula (ou staff) + trava `locked` (drip/sequencial calculado em `lib/learn.ts`). Drip é imposto também nas rotas e actions, não só na UI.
- **Mídia:** sempre via `getStorageProvider()` / `VideoProvider` (`server/media`). Vídeo do Drive é servido por proxy `/api/video/[lessonId]` com Range; nunca expor URL/ID crua do Drive.
- **Matrícula:** manual pelo admin (`/admin/alunos/[id]`) **ou** automática pelo webhook do Mercado Pago ao aprovar pagamento.
- **Checkout:** cartão tokenizado no browser (MercadoPago.js, public key `NEXT_PUBLIC_`); valor **sempre recalculado no servidor**; webhook re-busca o pagamento no MP (fonte da verdade) e cria `Enrollment` idempotente. Banner de teste aparece com credenciais `TEST-`.
- **Certificado:** ao chegar em 100% o aluno recebe emissão automática no Certimaker (espelha aluno → curso → turma → modelo). PDF servido via proxy `/api/certificate/[courseId]` (o endpoint do Certimaker exige Bearer). Validação pública em `/validar-certificado` usa `/api/validar` do Certimaker. Admin abre o editor de modelos do Certimaker via SSO (`openCertimakerCreator`).
- **Catálogo:** `lib/catalog.ts` lê cursos publicados do banco e converte enums → rótulos pt-BR para os componentes legados.

## Deploy (Coolify)

- App `cg-educacional-lms` (uuid `rskswcw8wgcc4ckko4so4gos`), build pack **Dockerfile**, branch `feat/nextjs-migration`.
- ⚠️ **Push NÃO dispara deploy** (webhook do GitHub não está ligado). Sempre que for publicar, siga o roteiro:
  1. `npm run build` local passa → commit → `git push origin feat/nextjs-migration`.
  2. Disparar o deploy pela API do Coolify (`http://161.97.136.40:8000/api/v1`). Token: **`coolify_apikey_pessoal`** em `../VARIAVEIS.env` (fora do repo; leia o valor por script, nunca imprima nem commite). A `COOLIFY_APIKEY` do `.env.local` está inválida.
     ```bash
     K=$(grep -E '^coolify_apikey_pessoal=' ../VARIAVEIS.env | cut -d= -f2- | tr -d '"\r ')
     curl -s -H "Authorization: Bearer $K" "http://161.97.136.40:8000/api/v1/deploy?uuid=rskswcw8wgcc4ckko4so4gos"
     # → devolve deployment_uuid
     ```
  3. **Esperar terminar**: poll em `GET /api/v1/deployments/<deployment_uuid>` a cada ~15s até `status` = `finished` (ou `failed`/`cancelled` → investigar os logs do deploy, não re-disparar às cegas). Confirme que o `commit` do deploy é o que foi pushado. Leva ~5 min.
  4. **Verificar o site no ar** (https://cgeducacional.com.br): `/`, `/cursos`, `/login`, `/cadastro`, `/eja`, `/api/health` (corpo com `db: up`) respondem 200; as rotas/assets tocados pela mudança estão servindo a versão nova; e um print da home (Playwright com `channel: "msedge"` — o Chromium do Playwright não está instalado) sem erros no console. Só então reporte como publicado; se algo falhar, diga o que falhou.
- O build do Docker **roda contra o banco de produção**: `prisma migrate deploy` (com retry, não-fatal), `seed-if-empty.ts` e `import-catalog.ts` (idempotentes). Migrations novas entram em produção no próximo deploy — escreva-as com cuidado.
- `NEXT_PUBLIC_*`, `DATABASE_URL` e `DIRECT_URL` são **build args** (inlined/usados no build); o resto é env de runtime no Coolify.
- Healthcheck `GET /api/health` sempre 200 (corpo informa `db: up|down`) para não gerar restart-loop.
- Existe um app antigo no Coolify (`cgeducacional.com`, branch `main`, nixpacks) — legado, não mexer sem confirmar.

## Convenções

- Código (nomes, tipos) em **inglês**; UI e comentários em **pt-BR**.
- Server Components por padrão; `'use client'` só com interatividade.
- Lógica de negócio em **Server Actions** (`app/**/actions.ts`), retorno `{ ok: true } | { error: string }`, `revalidatePath` nas rotas afetadas. Route Handlers só para streaming, upload multipart, webhook e health.
- **Zod** em toda action/rota que recebe dados (schemas em `lib/validations/`).
- Segredos só server-side; `serverEnv` nunca em Client Component. Só a public key do MP e as do Supabase podem ser `NEXT_PUBLIC_`.
- UI via shadcn (`components/ui`). Adicionar novos com `npx shadcn add <comp>`.
- **`docs/api.md` é doc viva:** ao criar/alterar/remover Route Handler ou Server Action, atualize-o na mesma mudança (skill `api-docs` em `.claude/skills/`; o pre-commit em `.githooks/` avisa se esquecer).
- Design system "CG Modern": tokens HSL em `app/globals.css`, azul institucional `cg-*` como primária + `teal-*` de destaque, cards `rounded-2xl` com sombra suave, micro-interações 200–300ms. Referência em `prompt-design.xml`. Skills locais: `frontend-design`, `ui-ux-pro-max` (paletas/tipografia/UX; scripts exigem Python), `web-design-guidelines` (revisão de UI/acessibilidade), `humanizer` (copy).
- Marca: logo oficial via `components/brand-logo.tsx` (`variant="mark"` nos cabeçalhos, `"stacked"` em login/rodapé); arquivos em `public/brand/`. Cor do logo = `cg-950` (#051A61); a escala `cg-*` e o `--primary` usam a mesma matiz (226).
- Commits pequenos, mensagens em pt-BR descrevendo a mudança.

## Pendências e pegadinhas conhecidas

- **Categorias da vitrine:** o enum do banco tem 12 categorias (migration `7_course_categories`), mas `lib/catalog.ts` e `types.ts` só mapeiam 4 (neurociência, pedagogia, gestão, inclusão). As demais caem em "Neurociência" na vitrine pública — afeta a maioria dos 260 cursos importados (138 são `outros`).
- Webhook do MP em produção: URL + segredo de assinatura ainda precisam ser configurados no painel do Mercado Pago.
- Resend: falta chave/domínio verificado — hoje e-mails são apenas logados.
- Sem testes automatizados; sem Sentry/logs estruturados.
- Rate limit (`lib/rate-limit.ts`) é em memória, por container.
- Drive via Service Account pode esbarrar em quota de armazenamento em pasta comum → usar Shared Drive para volume real.
- Assistente Gemini de chat da landing antiga não foi religado.
- Detalhes por fase e decisões em `tasks.md`.
