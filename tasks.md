# CG Educacional LMS — Plano de Execução

Ordem pensada para entregar valor cedo e manter o deploy no Coolify sempre verde.
Cada fase deve terminar com a aplicação rodando e deployável. `[ ]` = pendente.

Convenções: código em inglês, UI em pt-BR, commits pequenos por subtarefa, PR por fase.

---

## Fase 0 — Segurança e higiene (fazer primeiro)

- [ ] **Rotacionar o `COOLIFY_APIKEY`** no Coolify (a chave atual está exposta no `.env`).
- [ ] Adicionar `.env` ao `.gitignore`; usar `.env.local` para segredos.
- [ ] Conferir histórico git: se `.env` foi commitado, remover do tracking (`git rm --cached .env`) e considerar limpeza de histórico.
- [ ] Criar `.env.example` documentando todas as variáveis (sem valores).

---

## Fase 1 — Fundação Next.js (migração in-place)

- [ ] Criar branch `feat/nextjs-migration`.
- [ ] Inicializar **Next.js 15** (App Router, TypeScript, ESLint) na raiz, convivendo com os arquivos atuais durante a transição.
- [ ] Configurar **Tailwind** + paleta `cg-*`/`teal-*` (portar do design atual).
- [ ] Instalar e inicializar **shadcn/ui** (button, input, card, dialog, dropdown, toast, form, tabs, avatar, badge).
- [ ] Ajustar `tsconfig` (alias `@/*`), estrutura de pastas (`app/`, `components/`, `lib/`, `server/`).
- [ ] Configurar build/start para **Coolify** (Dockerfile ou Nixpacks; `output: 'standalone'` no `next.config`).
- [ ] Deploy de validação no Coolify (página em branco já no ar).

## Fase 2 — Landing institucional (porte do que já existe)

- [ ] Portar componentes atuais (`Header`, `Hero`, `Footer`, `CourseCard`, páginas EJA/Graduação/Pós/Cursos/Certificado) para o App Router.
- [ ] Converter navegação por `useState` em **rotas reais** (`/`, `/cursos`, `/eja`, `/graduacao`, `/pos-graduacao`, `/validar-certificado`).
- [ ] Mover dados de `constants.ts` para fonte de dados temporária (depois vem do banco).
- [ ] Manter assistente Gemini como Client Component opcional.

## Fase 3 — Dados e Auth

- [ ] Criar projeto **Supabase Cloud**; configurar env (`DATABASE_URL`, `SUPABASE_URL`, anon/service keys).
- [ ] Modelar **Prisma** schema (User, Course, Module, Lesson, Enrollment, LessonProgress, Certificate) + enums.
- [ ] Rodar primeira migration; criar seed com os cursos atuais.
- [ ] Configurar **Supabase Auth**: email/senha + **OAuth Google**.
- [ ] Políticas **RLS**: aluno só lê conteúdo de cursos em que tem `Enrollment`; instructor/admin gerenciam o que criam.
- [ ] Helpers de sessão (server) + middleware de proteção de rotas por role.
- [ ] Páginas de **login / cadastro / recuperação de senha** (shadcn forms + Zod).

## Fase 4 — Camada de mídia (modular, baixo custo)

Meta: começar só com **Google Drive (padrão, grátis)** + **YouTube unlisted (opção)**. Tudo atrás de abstração para plugar hosts pagos depois sem reescrever.

- [ ] Definir interfaces `VideoProvider` e `StorageProvider` em `server/media/`.
- [ ] Enum `videoProvider` em `Lesson` com **`drive` como default**.
- [ ] **Google Drive Service Account** (PADRÃO): criar credencial, pasta raiz; `DriveStorageProvider` (upload, listar, link de download) e `DriveVideoProvider`.
- [ ] **YouTube Data API v3** (OPCIONAL): OAuth do canal; `YouTubeVideoProvider` (upload como **unlisted**, retorna videoId). Ativar só quando for usar.
- [ ] **Player limpo** com **Plyr** (`plyr-react`): controles próprios; `controls=0` no YouTube; skin consistente para Drive e YouTube.
  - [ ] Overlay (`<div>` transparente) sobre a faixa superior para cobrir título/logo/"Assistir no YouTube"; play/seek via controles do Plyr.
- [ ] Resolver de player: dado `videoProvider`+`videoRef`, montar a fonte correta para o Plyr.
- [ ] Endpoint/Action de download de material (valida matrícula antes de gerar link).

### Fase 4.1 — Upgrade de vídeo (futuro, quando houver orçamento/escala)
- [ ] Adicionar `VideoProvider` pago: **Bunny Stream** ou **Cloudflare Stream** (player impecável, trava por domínio, signed URLs).
- [ ] Migração opcional de vídeos existentes; nenhuma mudança fora do novo adapter.

## Fase 5 — Painel do Professor / Admin

- [ ] Layout autenticado `/admin` com guard por role.
- [ ] CRUD de **cursos** (criar, editar, publicar/despublicar, thumbnail).
- [ ] Gestão de **módulos** e **aulas** (ordenável — drag & drop).
- [ ] **Upload de vídeo**: seletor de provider na criação da aula — **Drive pré-selecionado (padrão)**, YouTube unlisted como alternativa; barra de progresso.
- [ ] **Upload de material** (PDF/slides) para o Drive.
- [ ] **Gestão de alunos e matrículas**: listar alunos cadastrados e **ativar/remover curso** para cada um (matrícula manual — ver Fase 7).
- [ ] Visão de **progresso dos alunos** por curso (matrículas, % concluído).

## Fase 6 — Painel do Aluno

- [ ] Dashboard `/aprender` com cursos matriculados e continuar de onde parou.
- [ ] Página do curso: lista de módulos/aulas com estado (assistida/em andamento/bloqueada).
- [ ] **Player** com salvamento de progresso (`watchedSeconds`) e marcação de aula concluída.
- [ ] **Download** de materiais (com checagem de matrícula).
- [ ] Marcar curso como concluído ao atingir 100%.

## Fase 7 — Matrícula manual e Certificados

- [ ] **Matrícula manual via admin**: no painel admin, listar alunos cadastrados e **ativar curso(s)** para um aluno (cria `Enrollment`); permitir remover.
- [ ] (Opcional) Aluno solicita acesso a um curso → fica pendente para o admin aprovar.
- [ ] Geração de **certificado** (PDF) ao concluir; armazenar e expor link.
- [ ] Integrar **validação de certificado** (página já existente) com dados reais.

## Fase 8 — Pagamentos (POSTERIOR — Mercado Pago, configurar API depois)

> Gateway definido: **Mercado Pago**. API/credenciais serão configuradas em outro momento. Até lá, matrícula é manual (Fase 7).

- [ ] Configurar credenciais Mercado Pago (access token / public key).
- [ ] Checkout (Checkout Pro ou Bricks) na página do curso.
- [ ] Webhook que cria `Enrollment` automaticamente ao confirmar pagamento (substitui/ complementa a matrícula manual).

## Fase 9 — Qualidade, observabilidade e deploy

- [ ] **Email transacional** (Resend): confirmação de conta, recibo de matrícula, certificado emitido.
- [ ] Testes: unitários nas Server Actions/providers; e2e do fluxo aluno (Playwright).
- [ ] Logs/erros (ex.: Sentry) e healthcheck para o Coolify.
- [ ] Pipeline de deploy no Coolify documentado (migrations no deploy, variáveis de ambiente).
- [ ] Revisão de segurança final (RLS, exposição de segredos, rate limit nas rotas de upload).

---

## Decisões registradas

- **Supabase Cloud** (não self-host no Coolify, por enquanto).
- **Migração in-place** em nova branch (preserva projeto Coolify + domínio).
- **Vídeo**: **Google Drive (padrão, grátis)** + **YouTube unlisted (opção no painel)**, atrás de `VideoProvider`. Operação de baixo custo agora; hosts pagos (Bunny/Cloudflare/Mux) ficam como upgrade modular (Fase 4.1).
- **Player**: Plyr (`plyr-react`) com controles próprios + overlay para esconder a marca do YouTube.
- **Arquivos**: Google Drive (Service Account), atrás de `StorageProvider`.
- **Sem headless CMS** — dados em Prisma + RLS.
- **Matrícula**: **manual via admin** na fase atual (admin ativa curso p/ aluno cadastrado). Pagamento online (Mercado Pago) entra depois e cria matrícula via webhook.
- **Gateway de pagamento**: **Mercado Pago** (decidido). API configurada em fase posterior (Fase 8).

## A definir
- [ ] Modelo de privacidade de vídeo definitivo (Drive/unlisted agora; Bunny/Cloudflare/Mux com signed URLs + trava de domínio ao escalar — Fase 4.1).
- [ ] Provedor de email transacional (Resend assumido).
