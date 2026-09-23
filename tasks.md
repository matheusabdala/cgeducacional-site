# CG Educacional LMS — Plano de Execução

Ordem pensada para entregar valor cedo e manter o deploy no Coolify sempre verde.
Cada fase deve terminar com a aplicação rodando e deployável. `[ ]` = pendente.

Convenções: código em inglês, UI em pt-BR, commits pequenos por subtarefa, PR por fase.

---

## Fase 0 — Segurança e higiene (fazer primeiro)

- [ ] **Rotacionar o `COOLIFY_APIKEY`** no Coolify (boa prática; o `.env` nunca foi commitado, mas a chave é root).
- [x] Adicionar `.env` ao `.gitignore`. (`.env*` ignorado, exceto `.env.example`.)
- [x] Conferir histórico git: `.env` **não** estava rastreado (nunca commitado). OK.
- [x] Criar `.env.example` documentando todas as variáveis (sem valores).

---

## Fase 1 — Fundação Next.js (migração in-place)

- [x] Criar branch `feat/nextjs-migration`.
- [x] Inicializar **Next.js 15** (App Router, TypeScript, ESLint) na raiz, convivendo com os arquivos atuais durante a transição.
- [x] Configurar **Tailwind** + paleta `cg-*`/`teal-*` + **design system "CG Modern"** (tokens claro/escuro, fonte Inter, fundo ambiente, glows). Ver Decisões.
- [x] Instalar e inicializar **shadcn/ui** — base + `button`, `card`, `badge`, `input` criados (`components.json` + `cn`). `dialog`, `dropdown`, `toast`, `form`, `tabs`, `avatar` ficam para quando a tela precisar (`npx shadcn add`).
- [x] Ajustar `tsconfig` (alias `@/*`) + estrutura `app/` `components/` `components/ui/` `lib/`. (`server/` entra na Fase 4.)
- [x] Configurar build/start para **Coolify** (Dockerfile + `output: 'standalone'` no `next.config`).
- [x] Deploy de validação no Coolify — **app no ar** em `http://rskswcw8wgcc4ckko4so4gos.161.97.136.40.sslip.io` (domínio temporário sslip.io; app `cg-educacional-lms`, branch `feat/nextjs-migration`). Migration aplicada durante o build.

## Fase 2 — Landing institucional (porte do que já existe)

- [x] Portar componentes atuais (`Header`, `Hero`, `Footer`, `CourseCard`, páginas EJA/Graduação/Pós/Cursos/Certificado) para o App Router — **reestilizados no design system claro/escuro**.
- [x] Converter navegação por `useState` em **rotas reais** (`/`, `/cursos`, `/eja`, `/graduacao`, `/pos-graduacao`, `/validar-certificado`).
- [x] Mover dados de `constants.ts` para fonte de dados temporária (`constants.ts` é a fonte temporária; depois vem do banco).
- [ ] Manter assistente Gemini como Client Component opcional. _(ainda não religado — `services/` vazio; trazer do histórico Vite quando for ativar)_

## Fase 3 — Dados e Auth

> **Código da Fase 3 pronto e buildando.** Os passos que dependem de credenciais
> reais (criar projeto, rodar migration, aplicar RLS, habilitar provedores) estão
> no runbook **`docs/fase-3-setup.md`**.

- [x] Projeto **Supabase Cloud** criado e conectado (us-east-1). Banco via **pooler** `aws-1-us-east-1` (host direto é IPv6-only). Env no Coolify configurado.
- [x] Modelar **Prisma** schema (User, Course, Module, Lesson, Enrollment, LessonProgress, Certificate) + enums (`Role`, `CourseLevel`, `CourseCategory`, `VideoProvider`).
- [x] **Migration `0_init` aplicada** no Supabase (via `prisma migrate deploy` no build do Coolify). Seed dos cursos ainda pendente — a landing lê de `constants.ts`; `npm run db:seed` quando o LMS for ler cursos do banco.
- [x] **Supabase Auth** (código): server actions de email/senha + **OAuth Google**, callback (`/auth/callback`), `ensureProfile`. _Habilitar provedores no painel (runbook)._
- [x] Políticas **RLS** escritas em `prisma/rls.sql` (helpers `is_admin`/`is_enrolled`; aluno lê via `Enrollment`; instructor/admin gerenciam o próprio). _Aplicar no SQL Editor (runbook)._
- [x] Helpers de sessão (`lib/auth.ts`: `getAuthUser`/`requireUser`/`requireRole`) + middleware protegendo `/aprender` e `/admin`.
- [x] Páginas de **login / cadastro / recuperação de senha** (react-hook-form + Zod + shadcn), com login Google e fluxo de e-mail.

## Fase 4 — Camada de mídia (modular, baixo custo)

Meta: começar só com **Google Drive (padrão, grátis)** + **YouTube unlisted (opção)**. Tudo atrás de abstração para plugar hosts pagos depois sem reescrever.

- [x] Interfaces `VideoProvider` e `StorageProvider` em `server/media/types.ts`.
- [x] Enum `videoProvider` em `Lesson` com **`drive` como default** (no schema Prisma).
- [x] **Google Drive Service Account** (PADRÃO): `DriveStorageProvider` (upload/list/getStream/delete) e `DriveVideoProvider` em `server/media/drive.ts`. **Credenciais verificadas** (lista a pasta `_CG_EDUCACIONAL_CONTEUDO`). ⚠️ upload por SA em pasta comum pode esbarrar em quota → usar Shared Drive quando subir conteúdo de verdade.
- [~] **YouTube** (OPCIONAL): `YouTubeVideoProvider` resolve playback (videoId, não listado). Upload via Data API v3/OAuth fica para quando for usar.
- [x] **Player limpo** com **Plyr** (`plyr-react`) em `components/player/lesson-player.tsx`: controles próprios, `modestbranding`/`rel=0` no YouTube; skin consistente Drive (html5) e YouTube.
  - [x] Overlay (`<div>` transparente) sobre a faixa superior (mitiga marca do YouTube).
- [x] Resolver de player: `resolveVideoSource()` em `server/media/index.ts` (provider+ref → fonte do Plyr; Drive via proxy).
- [x] Stream/download via Route Handlers `/api/video/[lessonId]` e `/api/material/[lessonId]` — **validam matrícula** (`lib/access.ts`), Range/seeking no vídeo.

### Fase 4.1 — Upgrade de vídeo (futuro, quando houver orçamento/escala)
- [ ] Adicionar `VideoProvider` pago: **Bunny Stream** ou **Cloudflare Stream** (player impecável, trava por domínio, signed URLs).
- [ ] Migração opcional de vídeos existentes; nenhuma mudança fora do novo adapter.

## Fase 5 — Painel do Professor / Admin

- [x] Layout autenticado `/admin` com guard por role (`requireRole(["admin","instructor"])`), shell com sidebar + topbar (tema + menu do usuário). Páginas públicas movidas p/ route group `(marketing)` (URLs intactas).
- [x] CRUD de **cursos** (criar, editar, publicar/despublicar via Switch, excluir com confirmação, thumbnail/preço/categoria/nível). Lista em tabela + dashboard com métricas. Server actions + Zod, autorização por dono/admin.
- [x] Gestão de **módulos** e **aulas** — course builder com adicionar/editar/excluir e **reordenar via drag & drop** (dnd-kit, com handle + suporte a teclado + estado otimista).
- [x] **Upload de vídeo**: seletor de provider na aula — **Drive pré-selecionado (padrão)**, YouTube não listado como alternativa; upload via `/api/admin/upload` com **barra de progresso real** (XHR).
- [x] **Upload de material** (PDF/slides) para o Drive (mesma rota de upload).
- [x] **Gestão de alunos e matrículas**: `/admin/alunos` lista alunos (busca) e detalhe do aluno **ativa/remove curso** (matrícula manual — cria/remove `Enrollment`).
- [ ] Visão de **progresso dos alunos** por curso (% concluído) — depende do `LessonProgress` (Fase 6); por ora mostra contagem de matrículas.

## Fase 6 — Painel do Aluno

- [x] Dashboard `/aprender` com cursos matriculados, **% concluído** e **continuar de onde parou** (retoma na 1ª aula não concluída).
- [x] Página do curso `/aprender/[slug]`: módulos/aulas com estado (✓ concluída / atual), barra de progresso, botão continuar. _(navegação livre — gate sequencial "bloqueada" fica como opção futura.)_
- [x] **Player** (Plyr) na aula com **salvamento de progresso** (`watchedSeconds` a cada 15s + ao ocultar a aba, retoma na posição) e **marcar concluída** (auto-conclui ao terminar o vídeo). Outline lateral com navegação.
- [x] **Download** de materiais via `/api/material/[lessonId]` (checagem de matrícula).
- [x] Marca o **curso como concluído** (`Enrollment.completedAt`) ao atingir 100% das aulas.

### Extras (tipos de conteúdo + liberação programada)
- [x] **Aulas multi-formato**: cada aula pode ter **vídeo** (Drive/YouTube), **PDF exibido inline** (`documentFileId`), **conteúdo escrito** (`content`) e **material de apoio** (download) — em qualquer combinação. Cursos podem ser 100% escritos/PDF, sem vídeo. PDF servido inline via `/api/material?which=document&inline=1`.
- [x] **Gate sequencial** (opção por curso, `requireSequential`): trava a próxima aula até concluir a anterior.
- [x] **Drip / liberação programada** (opção por curso): libera `dripInitialCount` aulas na matrícula e o restante após `dripDelayDays` dias — **proteção contra reembolso** (CDC 7 dias). Imposto também nas rotas de conteúdo (`/api/video`, `/api/material`) e nas actions de progresso, não só na UI.
- Migration `1_content_and_gating` (aplica no próximo deploy).

## Fase 7 — Matrícula manual e Certificados

- [x] **Matrícula manual via admin** (feito na Fase 5: `/admin/alunos` ativa/remove `Enrollment`).
- [ ] (Opcional) Aluno solicita acesso a um curso → fica pendente para o admin aprovar.
- [x] **CPF obrigatório no cadastro** (`User.cpf`, validação de dígitos) + setter p/ quem entrou via Google.
- [x] Geração de **certificado** ao concluir o curso, via **integração Certimaker** (API key Bearer): espelha aluno/curso/turma (ids cacheados), emite o PDF e guarda código + URL pública no `Certificate`. Emissão **automática** ao atingir 100% + cartão "Emitir/Baixar" na página do curso. Idempotente; trata sem-CPF e sem-créditos. Migration `2_certimaker`.
  - ⚙️ Requer `CERTIMAKER_API_URL` + `CERTIMAKER_API_KEY` no env (LMS + Coolify).
- [x] Integrar **validação de certificado** (página `/validar-certificado`) com o `/api/validar` público do Certimaker (`validateCertificate` em `(marketing)/validar-certificado/actions.ts`).

## Fase 8 — Pagamentos (Mercado Pago — checkout transparente profissional)

> Gateway: **Mercado Pago**, checkout transparente (não Checkout Pro). Cartão e PIX, desconto PIX configurável, painel de compras + carrinhos abandonados. Coexiste com a matrícula manual (Fase 7).

- [x] Credenciais Mercado Pago no env (`.env` + Coolify): `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_PIX_DISCOUNT` (default 2%), `MERCADOPAGO_WEBHOOK_SECRET` (opcional).
- [x] **Modelo `Order`** (compras + carrinhos): status, método, valor/desconto/parcelas, CPF do pagador, `mpPaymentId`. Migration `5_orders`.
- [x] **Checkout transparente** `/checkout/[courseId]` (exige login): abas **PIX** (QR + copia-e-cola + polling) e **Cartão** (preview animado com bandeira/flip, tokenização client-side via MercadoPago.js, parcelas até 12x com juros via API do MP). CPF validado no cadastro e no checkout.
- [x] **Segurança:** cartão tokenizado no cliente (PCI SAQ-A); valor **sempre recalculado no servidor**; idempotência; reconciliação anti-race.
- [x] **Webhook** `/api/payments/webhook`: verifica assinatura (`x-signature`), re-busca o pagamento (fonte da verdade), cria `Enrollment` idempotente + e-mail.
- [x] **Admin `/admin/compras`**: lista (filtros: pagas / abandonados) + detalhe + CTA de remarketing.
- [ ] Configurar a URL do webhook + segredo de assinatura no painel do Mercado Pago (produção).
- [ ] (Futuro) cupons de desconto; reembolso pelo admin.

## Fase 9 — Qualidade, observabilidade e deploy

- [~] **Email transacional** (Resend): abstração `server/email` (HTTP, sem dep extra, **degradação graciosa** sem `RESEND_API_KEY`) + templates. Plugado em **matrícula confirmada** (`/admin/alunos`) e **certificado emitido** (`/aprender`). _Falta confirmação de conta (gerida pelo Supabase) e a chave/domínio verificados no Resend._
- [ ] Testes: unitários nas Server Actions/providers; e2e do fluxo aluno (Playwright).
- [x] **Healthcheck** `/api/health` (liveness 200 + status do banco no corpo; não derruba o container em blip do Supabase). _Falta plugar logs/erros (ex.: Sentry)._
- [ ] Pipeline de deploy no Coolify documentado (migrations no deploy, variáveis de ambiente).
- [~] Revisão de segurança: **rate limit no upload** (`lib/rate-limit.ts`, 40/5min por usuário em `/api/admin/upload`). _Falta varredura final de RLS/segredos._

## Fase 10 — Assinatura eletrônica de documentos

> Módulo `server/esign` (agnóstico de UI, extraível para um produto próprio), painel em
> `/admin/documentos`, página pública `/assinar/[token]`, validação em `/validar-documento`
> e REST `/api/esign/v1` (Bearer `ESIGN_API_KEY`). Detalhes: `docs/esign.md`.

- [x] **Fundação**: deps (`pdf-lib`, `react-pdf` 11, `signature_pad`, `qrcode`, `ua-parser-js` 1.x), migration `8_esign` (5 tabelas `Esign*`), Supabase Storage (bucket privado `esign`, service role), `ESIGN_*` no env.
- [x] **Upload** do computador (drag&drop, 25 MB), **por link** (SSRF-safe; Drive/Dropbox viram download direto) e **pelo celular** (QR de uso único, sem login). Word recusado com mensagem clara.
- [x] **Editor de campos**: vários signatários (nome/e-mail/CPF opcionais), campos Assinatura/Nome/CPF/Data com clique para posicionar, arrastar, redimensionar e teclado; salvamento automático.
- [x] **Envio**: link pessoal por signatário, convite por e-mail (opcional), copiar link, WhatsApp, QR para assinatura presencial, reenviar, gerar novo link, cancelar.
- [x] **Assinatura** (mobile-first): documento com campos em destaque → nome + CPF (+ código por e-mail, configurável) → desenhar / digitar / **com o dedo no celular via QR** → consentimento → registro.
- [x] **PDF final**: carimbos nos campos + marca no rodapé + **Relatório de assinaturas** (logo, CNPJ, evidências por signatário, hashes, QR de validação). Regerado a cada assinatura; imutável ao concluir.
- [x] **Evidências**: IP, dispositivo (desktop e celular), data/hora (Campo Grande + UTC), OTP, geolocalização opcional, SHA-256 do original/assinado/imagem, trilha de eventos encadeada por hash (`verifyAuditChain`).
- [x] **Validação pública** por código + conferência do arquivo por hash no navegador.
- [x] **PWA + Web Share Target**: painel instalável; PDF do WhatsApp → *Compartilhar* → abre "Novo documento" já carregado (Android/Chrome). iOS usa o QR.
- [x] **REST v1** + gancho `sealWithCertificate` (selo ICP-Brasil A1 futuro).
- [ ] ⚠️ **Resend com domínio verificado** — sem isso o código por e-mail não chega aos signatários (desligar "Exigir código por e-mail" até lá).
- [ ] (Futuro) Word → PDF via Gotenberg; selo A1 com `@signpdf`; assinatura sequencial; webhooks da REST; WhatsApp Business Cloud API.

---

## Decisões registradas

- **Design system "CG Modern"**: linguagem visual do `prompt-design.xml` (near-black, luz ambiente em camadas, glows, sombras multi-camada, micro-interações expo-out 200–300ms) com o **azul institucional CG (`cg-*`) como acento** (não o índigo do prompt) + teal como destaque. **Dois temas**: claro por padrão (acolhedor p/ educação) + escuro moderno, alternáveis via toggle (`next-themes`). Tokens em HSL via CSS vars (compatível shadcn/ui). Fonte **Inter**.
- **Supabase Cloud** (não self-host no Coolify, por enquanto).
- **Migração in-place** em nova branch (preserva projeto Coolify + domínio).
- **Vídeo**: **Google Drive (padrão, grátis)** + **YouTube unlisted (opção no painel)**, atrás de `VideoProvider`. Operação de baixo custo agora; hosts pagos (Bunny/Cloudflare/Mux) ficam como upgrade modular (Fase 4.1).
- **Player**: Plyr (`plyr-react`) com controles próprios + overlay para esconder a marca do YouTube.
- **Arquivos**: Google Drive (Service Account), atrás de `StorageProvider`.
- **Sem headless CMS** — dados em Prisma + RLS.
- **Matrícula**: **manual via admin** na fase atual (admin ativa curso p/ aluno cadastrado). Pagamento online (Mercado Pago) entra depois e cria matrícula via webhook.
- **Gateway de pagamento**: **Mercado Pago** (decidido). API configurada em fase posterior (Fase 8).
- **Assinatura eletrônica — validade**: assinatura eletrônica **avançada** (MP 2.200-2 art. 10 § 2º; Lei 14.063/2020 art. 4º II). Selo ICP-Brasil (e-CNPJ A1) fica como gancho (`server/esign/pdf/seal.ts`).
- **Assinatura eletrônica — módulo**: lógica toda em `server/esign`, com uma única fronteira (`deps.ts`); modelos `Esign*` sem FK para `User` (snapshot do criador) — para virar produto/app próprio. UI (actions), páginas públicas e REST v1 são camadas finas.
- **Assinatura eletrônica — storage**: Supabase Storage (bucket privado `esign`, service role) atrás de `EsignStorage` própria. Bytes sempre via rotas com autorização.
- **Assinatura eletrônica — tokens**: 256 bits; no banco só o SHA-256 (busca) + versão AES-256-GCM (`ESIGN_SECRET`) para "copiar link" sem rotacionar.
- **Assinatura eletrônica — Word**: fora do v1 (converter para PDF antes); gancho `originalMime` para Gotenberg.
- **Painel como PWA**: instalável; `share_target` recebe PDFs do "Compartilhar" do Android. Service worker mínimo, sem cache de páginas.
- **NAV do admin filtrado por role**: "Compras" e "Documentos" só aparecem para admin.

## A definir
- [ ] Modelo de privacidade de vídeo definitivo (Drive/unlisted agora; Bunny/Cloudflare/Mux com signed URLs + trava de domínio ao escalar — Fase 4.1).
- [ ] Provedor de email transacional (Resend assumido).
