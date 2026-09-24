# Referência de API — CG Educacional LMS

> **Doc viva.** Este arquivo é a fonte de verdade da superfície de API do LMS e
> serve de contexto para o Claude. **Sempre que criar, alterar ou remover um
> Route Handler ou uma Server Action, atualize este arquivo na mesma mudança.**
> A skill `api-docs` (`.claude/skills/api-docs/SKILL.md`) descreve o processo.
>
> Última verificação contra o código: **Fase 10 — assinatura eletrônica** (2026-09-23).

## Como a API é organizada

Duas superfícies, por convenção do projeto (ver [CLAUDE.md](../CLAUDE.md)):

1. **Route Handlers** (`app/api/**/route.ts`) — usados **só** para o que precisa
   de HTTP cru: streaming de bytes (vídeo/material/PDF), upload multipart,
   webhook externo e healthcheck.
2. **Server Actions** (`app/**/actions.ts`) — **toda a lógica de negócio**
   (CRUD, matrícula, progresso, checkout, auth, certificados). Chamadas direto
   dos componentes; nunca expostas como endpoint REST.

### Regras transversais (valem para as duas superfícies)

- **Auth**: sessão via Supabase (cookies). Helpers em `@/lib/auth`:
  `getAuthUser()` (usuário ou `null`), `getCurrentProfile()` (com `role`),
  `requireRole(...)`. O `middleware.ts` só garante **presença de login** nos
  prefixos `/aprender` e `/admin`; o guard fino por role fica server-side.
- **Acesso a conteúdo**: `@/lib/access` → `getLessonForUser(lessonId, userId)`
  valida matrícula + trava de liberação (`locked`). Nenhuma rota serve bytes de
  aula sem passar por ele.
- **Mídia**: sempre via `getStorageProvider()` / `VideoProvider` de
  `@/server/media`. Componentes e rotas **nunca** falam com Drive/YouTube direto,
  nem expõem URL crua.
- **Validação**: entrada validada com **Zod** em toda Action/rota que recebe dados.
- **Retorno das Actions**: padrão `{ ok: true } | { error: string }` (variações
  documentadas por Action). Revalidam rotas afetadas via `revalidatePath`.

---

## Route Handlers

| Rota | Métodos | Auth | Resumo |
|---|---|---|---|
| `/api/health` | GET | pública | Healthcheck do Coolify |
| `/api/video/[lessonId]` | GET | login + matrícula | Proxy de stream de vídeo do Drive |
| `/api/material/[lessonId]` | GET | login + matrícula | Serve PDF/material do Drive |
| `/api/certificate/[courseId]` | GET | login | Proxy do PDF do certificado (Certimaker) |
| `/api/admin/upload` | POST | admin/instructor | Upload de arquivo para o Drive |
| `/api/payments/webhook` | GET, POST | assinatura MP | Webhook do Mercado Pago |
| `/api/esign/upload` | POST | admin | Upload de PDF p/ assinatura (até 25 MB) |
| `/api/esign/files/[documentId]/[which]` | GET | admin | PDF original/assinado (proxy do Storage) |
| `/api/esign/s/[token]/[which]` | GET | token do signatário | PDF para quem vai assinar |
| `/api/esign/phone-upload/[code]` | POST | código do QR (uso único) | Upload de PDF feito pelo celular |
| `/api/esign/v1/**` | vários | Bearer `ESIGN_API_KEY` | REST do módulo de assinatura (ver abaixo) |
| `/admin/documentos/compartilhar` | POST, GET | — | Destino do share_target do PWA (fallback do SW) |

### `GET /api/health`
`app/api/health/route.ts` — **pública, liveness.** Responde **sempre 200**
enquanto o processo Next está de pé (propositalmente não devolve 5xx quando o
banco cai, para não disparar restart-loop no Coolify). Corpo:
`{ status: "ok", db: "up" | "down", ts }`.

### `GET /api/video/[lessonId]`
`app/api/video/[lessonId]/route.ts` — proxy de stream do **Drive**. Encaminha o
header `Range` (seeking → `206 Partial Content`). YouTube **não** passa por aqui
(o player toca direto pelo `videoId`).
- **401** sem login · **403** sem acesso ou aula bloqueada (`locked`) ·
  **404** se a aula não é `drive` ou não tem `videoRef`.
- Headers: `Content-Type`, `Accept-Ranges: bytes`, `Cache-Control: private, no-store`,
  `Content-Length`/`Content-Range` quando disponíveis.

### `GET /api/material/[lessonId]`
`app/api/material/[lessonId]/route.ts` — serve um arquivo do Drive da aula.
- Query: `which=document` serve o PDF/documento da aula (padrão = `material`, o
  material de apoio). `inline=1` exibe no navegador (embed) em vez de baixar.
- **401/403** iguais ao vídeo · **404** se o `fileId` correspondente é nulo.

### `GET /api/certificate/[courseId]`
`app/api/certificate/[courseId]/route.ts` — proxy do PDF do certificado. O aluno
autentica no LMS; o LMS busca o PDF no **Certimaker** pela API key (`certimaker.fetchPdf(code)`)
e repassa. `inline=1` abre no navegador.
- **401** sem login · **404** se não há `Certificate` para `(userId, courseId)` ·
  **502** se o Certimaker falha.

### `POST /api/admin/upload`
`app/api/admin/upload/route.ts` — upload multipart (`FormData`, campo `file`) de
vídeo/material para o Drive via `getStorageProvider().upload(...)`. **Só
admin/instructor.**
- **Rate limit**: 40 uploads / 5 min por usuário (`429` + `Retry-After`).
- **403** sem permissão · **400** arquivo ausente · **500** falha no upload
  (SA em pasta comum pode falhar por quota → usar Shared Drive).
- Sucesso: `{ id, name }` do arquivo no Drive.

### `/api/payments/webhook`
`app/api/payments/webhook/route.ts` — **FONTE DA VERDADE** da confirmação de
pagamento do Mercado Pago.
- **POST**: lê o id do pagamento (query `data.id`/`id` e/ou corpo JSON),
  **verifica a assinatura** (`verifyWebhookSignature`), **re-busca o pagamento na
  API** (não confia no corpo, `getPayment`) e **concilia o pedido**
  (`reconcilePayment` → cria a matrícula idempotente). Responde **200** sempre
  que trata/ignora (evita reenvio infinito do MP); **401** só quando a assinatura
  é inválida.
- **GET**: `{ ok: true }` (teste de verificação do MP).
- ⚠️ A assinatura só é checada **se o segredo estiver configurado** — garanta
  `MP_WEBHOOK_SECRET` em produção.

### Assinatura eletrônica (`server/esign`) — rotas de bytes
Toda regra de negócio está em `server/esign` (ver [esign.md](esign.md)); as rotas
só autorizam e transportam bytes. Ficam **fora do matcher do middleware** (que
cortaria uploads > 10 MB) e fazem a própria autorização.
- `POST /api/esign/upload` — multipart `file` (+ `title?`, `source?`). **Só admin.**
  Rate limit 30/10 min. Recusa Word (**415** "Converta para PDF…"), PDF cifrado
  (**422**), > 25 MB (**413**). Sucesso: `{ id, code, name }` (rascunho criado).
- `GET /api/esign/files/[documentId]/original|signed` — **só admin**; `?download=1`
  baixa (padrão: inline). **404** se ainda não há versão assinada.
- `GET /api/esign/s/[token]/original|signed` — autorizado pelo **token do link**
  do signatário; rate limit 60/min por IP. **404/410** link inválido/cancelado.
- `POST /api/esign/phone-upload/[code]` — página `/m/upload/[code]` (QR do painel);
  código de **uso único, 10 min**, sem login. Cria o rascunho em nome do operador
  que gerou o QR. **410** QR usado/expirado.
- `/admin/documentos/compartilhar` — destino do `share_target` do PWA. O service
  worker (`public/sw.js`) intercepta o POST, guarda o arquivo no Cache API e
  redireciona para `/admin/documentos/novo?compartilhado=<id>`; a rota só responde
  se o SW não estiver ativo (303 → `?erro=compartilhamento`).

### REST `/api/esign/v1` (integrações / futuro app próprio)
Auth: `Authorization: Bearer <ESIGN_API_KEY>` (**503** se a chave não estiver
configurada, **401** se inválida). Erros: `{ error, code }` com o status do `EsignError`.

| Método | Rota | Papel |
|---|---|---|
| GET | `/documents?status=&q=&page=&perPage=` | Lista paginada |
| POST | `/documents` | multipart `file` → rascunho · JSON `{ url, title?, requireOtp?, message?, signers?, fields?, send?, sendEmails? }` (`fields[].signer` = índice em `signers`) |
| GET | `/documents/:id` | Documento + signatários + campos + trilha (sem tokens) |
| DELETE | `/documents/:id` | Apaga rascunho |
| PUT | `/documents/:id/draft` | Substitui o rascunho: `{ title, requireOtp, message?, signers[{key,id?,name?,email?,cpf?}], fields[{signerKey,kind,page,x,y,w,h}] }` (x/y/w/h relativos 0..1) |
| POST | `/documents/:id/send` | `{ sendEmails? }` → `{ links: [{ signerId, link, emailSent }] }` |
| POST | `/documents/:id/cancel` | Cancela (links param de funcionar) |
| GET | `/documents/:id/files/original\|signed` | Bytes do PDF |
| GET / POST | `/documents/:id/signers/:signerId/link` | Link atual / gera um novo |

---

## Server Actions

Assinaturas resumidas. Todas server-side, validadas com Zod, retorno no padrão
`{ ok } | { error }` salvo indicação. Guards de role via `requireRole`/checagem
de dono do curso.

### Auth — `app/(auth)/actions.ts`
| Action | Papel |
|---|---|
| `signInAction(...)` | Login por e-mail/senha |
| `signUpAction(values)` | Cadastro (nasce como `student`) |
| `signInWithGoogleAction(next?)` | Início do OAuth Google |
| `requestPasswordResetAction(...)` | Envia e-mail de recuperação |
| `signOutAction()` | Logout |

### Admin · Cursos/Módulos/Aulas — `app/admin/cursos/actions.ts`
Guard: admin ou dono do curso. Inclui a integração Certimaker.
| Action | Papel |
|---|---|
| `openCertimakerCreator()` | Gera URL de SSO p/ o criador de modelos no Certimaker |
| `generateCourseDraft(hints)` | IA (Gemini): sugere título, descrição, conteúdo programático, carga horária, nível e categoria a partir de dicas livres. Ver `ai-actions.ts` |
| `createCourse` / `updateCourse` / `deleteCourse` | CRUD de curso |
| `togglePublish(...)` | Publica/despublica |
| `bulkSetPublished(ids, published)` / `bulkDeleteCourses(ids)` | Ações em massa da listagem (até 200 ids, Zod `courseIdsSchema`). Instrutor: ids de cursos alheios são ignorados. Retorna `{ ok, count }` |
| `toggleFavorite(courseId, favorite)` | Estrela do curso para o usuário logado (`CourseFavorite`); filtro `?fav=1` em `/admin/cursos` |
| `createModule` / `updateModule` / `deleteModule` | CRUD de módulo |
| `moveModule(...)` / `reorderModules(...)` | Reordenação (troca vizinho / drag&drop) |
| `createLesson` / `updateLesson` / `deleteLesson` | CRUD de aula |
| `moveLesson(...)` / `reorderLessons(...)` | Reordenação de aulas |

> `reorderModules` aplica em duas passadas (ordens temporárias negativas → finais)
> para não violar o unique `[courseId, order]` no meio da transação.

### Admin · Matrículas — `app/admin/alunos/actions.ts`
| Action | Papel |
|---|---|
| `enrollUserInCourse(...)` | Matricula (idempotente via `@@unique([userId, courseId])`) |
| `removeEnrollment(...)` | Remove matrícula (idempotente) |

### Aluno · Progresso — `app/aprender/actions.ts`
| Action | Papel |
|---|---|
| `saveProgress(input)` | Salva posição assistida (resume); chamada periódica do player |
| `markLessonComplete(lessonId)` | Conclui a aula (e o curso se 100%) |
| `markLessonIncomplete(lessonId)` | Desmarca a conclusão |

### Aluno · Certificados — `app/aprender/certificate-actions.ts`
| Action | Papel |
|---|---|
| `issueCertificate(courseId)` | Emite/retorna o certificado (idempotente); espelha aluno/curso/turma no Certimaker e emite via API key. Datas da turma = `Course.startDate`/`endDate` quando definidas, senão matrícula/conclusão do aluno |
| `setCpf(value)` | Define CPF do aluno (quem entrou via Google sem CPF) |

### Checkout · Pagamentos — `app/checkout/[courseId]/actions.ts`
| Action | Papel |
|---|---|
| `initiateOrder(courseId)` | Cria/reutiliza o pedido (status `initiated`) |
| `payWithCard(input)` | Pagamento com cartão (token gerado no cliente via SDK do MP) |
| `payWithPix(input)` | Pagamento PIX — retorna QR (imagem + copia-e-cola) |
| `getOrderStatus(...)` | Polling do status do PIX; reconcilia com o MP se pendente |

### Público · Validação de certificado — `app/(marketing)/validar-certificado/actions.ts`
| Action | Papel |
|---|---|
| `validateCertificate(...)` | Valida um certificado (público) consultando o Certimaker |

### Admin · Documentos (assinatura) — `app/admin/documentos/actions.ts`
Guard: **só admin** (`requireRole(["admin"])`). Chamam `server/esign` com o ator + IP/UA.

| Action | Papel |
|---|---|
| `saveDraftAction(id, draft)` | Salva o rascunho inteiro (título, opções, signatários, campos); devolve `key → id` dos signatários |
| `sendDocumentAction(id, { sendEmails })` | Gera os links e (opcional) envia convites; retorna `{ emailed, emailFailed }` |
| `createFromUrlAction(url)` | Importa PDF de um link público (SSRF-safe) |
| `createPhoneUploadAction()` / `phoneUploadStatusAction(code)` | QR para enviar o PDF pelo celular + polling |
| `getSignerLinkAction(signerId)` | Link atual (descriptografado) |
| `rotateSignerLinkAction(signerId, documentId)` | Novo link (o anterior para de funcionar) |
| `resendInviteAction(signerId, documentId)` | Reenvia o convite por e-mail |
| `cancelDocumentAction(id)` / `deleteDraftAction(id)` | Cancela documento / apaga rascunho |
| `waiveOtpAction(id)` | Dispensa o código por e-mail de um documento aguardando assinatura (evento `otp_waived` na trilha) |

### Público · Assinatura — `app/(esign)/assinar/[token]/actions.ts`
Sem login: autorizadas pelo **token do link**; rate limit por IP.

| Action | Papel |
|---|---|
| `identifyAction(token, { name, cpf, email? })` | Valida CPF (e o CPF exigido); se o documento exige, envia o código por e-mail → `{ needsOtp, sentTo }` |
| `requestOtpAction(token, email)` / `verifyOtpAction(token, code)` | Reenvio (45 s; 3 a cada 15 min) e verificação (5 tentativas; 10 min) |
| `createPhoneSignatureAction(token)` / `phoneSignatureStatusAction(token, code)` | QR para assinar com o dedo no celular + polling |
| `submitSignatureAction(token, input)` | Registra a assinatura (`draw\|type\|phone`), regera o PDF e conclui se for a última |

### Público · Assinatura no celular — `app/(esign)/m/actions.ts`

| Action | Papel |
|---|---|
| `submitPhoneSignatureAction(code, pngBase64)` | Página `/m/assinatura/[code]`: envia o PNG desenhado (sessão de uso único) |

### Público · Validação de documento — `app/(marketing)/validar-documento/actions.ts`

| Action | Papel |
|---|---|
| `validateDocumentAction(code)` | Status, signatários (primeiro nome + CPF mascarado) e hashes, pelo código `DOC-XXXX-XXXX` |

---

## Middleware & proteção de rotas
`middleware.ts` — renova a sessão do Supabase a cada request e redireciona:
- não logado em `/aprender` ou `/admin` → `/login?next=<path>`;
- logado em `/login`/`/cadastro` → `/aprender`.

O matcher **exclui** `/api/esign/*`, `/sw.js` e `/manifest.webmanifest` (as rotas de
assinatura autorizam por conta própria e recebem uploads grandes). As páginas
públicas `/assinar/*`, `/m/*` e `/validar-documento` não exigem login.

O guard por role (admin vs aluno) **não** está no middleware (edge) — fica nos
layouts server-side via `requireRole`.
