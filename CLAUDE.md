# CG Educacional — LMS

## O que é

Plataforma LMS para a **CG Educacional** (instituição de ensino brasileira: neurociência, educação inclusiva, formação de professores, EJA).

O repositório nasceu como site institucional em **React 19 + Vite (SPA)**. Está sendo migrado **in-place** para um LMS completo em **Next.js 15**, com painéis de aluno e professor/admin, cursos, módulos, aulas em vídeo e materiais para download.

- Repo: `github.com/matheusabdala/cgeducacional-site`
- Hospedagem: **Coolify** (self-hosted PaaS) — `coolify.cgeducacional.com`
- Estratégia de migração: nova branch neste mesmo repo (preserva o projeto/domínio no Coolify; o app Vite atual fica preservado no histórico git e é portado como landing).

## Stack

| Camada | Tecnologia | Notas |
|---|---|---|
| Framework | **Next.js 15** (App Router, Server Actions) | Server Components por padrão |
| Auth + DB + Storage de app | **Supabase Cloud** | Auth (email + OAuth Google), Postgres, RLS |
| ORM | **Prisma** | Migrations versionadas; conecta no Postgres do Supabase |
| UI | **shadcn/ui + Tailwind CSS** | Reaproveita identidade visual atual (`cg-*`, `teal-*`) |
| Vídeo | **Google Drive** (padrão) e **YouTube não listado** (opcional) | Via abstração `VideoProvider` (ver abaixo) |
| Arquivos/materiais | **Google Drive** (Service Account) | Via abstração `StorageProvider` |
| Player | **Plyr** (`plyr-react`) | Controles próprios + overlay para esconder marca do YouTube |
| Email transacional | **Resend** (sugerido) | Confirmação de cadastro, certificados |
| Pagamentos | **Mercado Pago** | Fase posterior — API configurada depois; por ora matrícula é manual |
| IA assistente | **@google/genai** (Gemini) | Já existe no app atual; manter opcional |
| Deploy | **Coolify** (API disponível) | Nixpacks/Dockerfile para o Next |

### Por que não headless CMS
Schema de LMS é estruturado e previsível (curso → módulo → aula → progresso). Um CMS headless adicionaria abstração sem ganho. Modelagem fica em Prisma + RLS no Supabase.

## Arquitetura de mídia (ponto central do design)

**Objetivo de negócio:** operação de **baixo custo agora**. Começa só com Google Drive (grátis) como **padrão**, e YouTube não listado como **opção** escolhida pelo professor/admin ao criar a aula. Estrutura **modular** para plugar hosts pagos depois (Bunny/Cloudflare Stream/Mux) sem reescrever o app.

Vídeos podem vir de **Google Drive** (padrão) ou **YouTube unlisted** (opcional), e arquivos do **Google Drive** — mas o resto do app não deve saber disso. Toda mídia passa por abstrações.

```
VideoProvider (interface)
 ├─ DriveVideoProvider     → file id do Drive   (PADRÃO)
 ├─ YouTubeVideoProvider   → video id (unlisted) (OPCIONAL)
 └─ (futuro) Bunny/CloudflareStream/Mux → upgrade pago, signed URLs

StorageProvider (interface)
 └─ DriveStorageProvider   → upload/listagem/link de download
```

- `Lesson` guarda `videoProvider` (enum) + `videoRef` (id no provider), não URL crua.
- **Padrão = Drive.** No painel do professor/admin, ao criar/editar a aula, há um seletor de provider; Drive vem pré-selecionado, YouTube unlisted é alternativa.

### Player limpo (esconder marca do YouTube)
- Usar **Plyr** (`plyr-react`): ele renderiza o YouTube com `controls=0` e aplica **controles próprios**, escondendo a maior parte da UI nativa.
- Complementar com um **overlay** (`<div>` transparente sobre a faixa superior) para cobrir o título/logo/"Assistir no YouTube" que aparecem no pause/hover. O play/seek continua pelos controles do Plyr.
- Ressalva honesta: isso **mitiga**, não é 100% à prova nem livre de quebras quando o YouTube muda layout (e é zona cinzenta dos Termos). Para player realmente impecável + trava por domínio, o caminho é o upgrade pago (fase futura).
- Para Drive, o Plyr toca o arquivo (ou embed do Drive) com a mesma skin — UX consistente entre providers.

### Limitações conhecidas (plano de saída)
- **YouTube:** `private` só toca pro dono do canal (inútil p/ alunos) → usamos **`unlisted`** (não indexado, mas embedável por qualquer um que tenha o ID; sem trava de domínio). Não é DRM.
- **Drive:** quotas de banda e views simultâneas; player básico. OK para volume inicial.
- **Upgrade:** quando precisar de player impecável, trava de domínio e signed URLs → adicionar **Bunny Stream** ou **Cloudflare Stream** como novo `VideoProvider`. Nada no app muda além do adapter.

## APIs externas necessárias

1. **Supabase** — projeto Cloud (URL, anon key, service_role key, DATABASE_URL).
2. **Google Drive API** — Service Account (uploads do admin, sem OAuth do usuário). Pasta raiz dedicada.
3. **YouTube Data API v3** — OAuth do canal da instituição (upload exige OAuth, não Service Account). Opcional/secundário — só ativar quando for usar YouTube unlisted.
4. **Coolify API** — deploy/infra (chave já existe; **rotacionar**, ver Segurança).
5. **Resend** (ou similar) — email transacional.
6. **Mercado Pago** — pagamentos (fase posterior; API configurada em outro momento). Por ora, matrícula manual via admin, sem gateway.
7. **Gemini** (`@google/genai`) — assistente IA (opcional, já presente).

## Modelo de dados (rascunho)

```
User            id, email, name, role(student|instructor|admin), avatarUrl
Course          id, title, slug, description, thumbnailUrl, category, level, price, instructorId, published
Module          id, courseId, title, order
Lesson          id, moduleId, title, description, order, durationSeconds,
                videoProvider(drive|youtube), videoRef, materialFileId(nullable)
Enrollment      id, userId, courseId, enrolledAt, completedAt
LessonProgress  id, userId, lessonId, watchedSeconds, completed, lastWatchedAt
Certificate     id, userId, courseId, issuedAt, certificateUrl
```
Roles: `student`, `instructor`, `admin`. Acesso ao conteúdo controlado por `Enrollment` + RLS.

**Matrícula (fase atual):** **manual**. O aluno se cadastra; um **admin ativa o curso para o aluno** (cria o `Enrollment`) pelo painel. Pagamento online (Mercado Pago) entra depois e passará a criar o `Enrollment` automaticamente via webhook — sem mudar o modelo de acesso.

## Padrões de desenvolvimento

- Código em **inglês** (vars/funções/tipos); **UI em pt-BR**.
- Server Components por padrão; `'use client'` só quando há interatividade/hooks.
- Lógica de negócio em Server Actions / Route Handlers — nunca exposta no cliente.
- UI via **shadcn/ui** — não reinventar botão/input/modal/toast.
- Segredos sempre server-side; **nunca** chave de API com prefixo `NEXT_PUBLIC_`.
- Validação de entrada com **Zod** em toda Server Action / route.
- Mídia sempre via `VideoProvider` / `StorageProvider`, nunca chamando Drive/YouTube direto nos componentes.
- **API documentada em [`docs/api.md`](docs/api.md)** (Route Handlers + Server Actions). Ao criar/alterar/remover uma rota ou Server Action, **atualize `docs/api.md` na mesma mudança** — ver a skill `api-docs` (`.claude/skills/api-docs/`).

## Identidade visual (do app atual)

- Primária `cg-*` (azul institucional), destaque `teal-*`.
- Cards com sombra suave, `rounded-2xl`, hover com elevação. Sans-serif.
- Componentes/landing atuais em `App.tsx` + `components/` servem de referência e serão portados.

## Segurança (atenção imediata)

- ⚠️ `.env` **não está** no `.gitignore` e contém `COOLIFY_APIKEY` root. **Rotacionar a chave**, mover para `.env.local`, adicionar `.env` ao `.gitignore`. (Task 0 em `tasks.md`.)
- Service Account do Drive e OAuth do YouTube: credenciais só server-side.

## Roadmap

Plano de execução detalhado e ordenado em **`tasks.md`** (raiz do projeto).
