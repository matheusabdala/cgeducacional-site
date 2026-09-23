# Assinatura eletrônica de documentos (`server/esign`)

Módulo para colher assinaturas em PDFs: o operador sobe o documento, marca onde
cada pessoa assina, manda o link (e-mail, WhatsApp ou QR no balcão) e recebe de
volta o PDF carimbado com um **Relatório de assinaturas** (logo, CNPJ, evidências,
hash e QR de validação).

**Validade jurídica:** assinatura eletrônica **avançada** — Lei 14.063/2020 art. 4º II
e MP 2.200-2/2001 art. 10 § 2º (válida entre particulares quando as partes aceitam o
meio; o signatário marca o consentimento). Evidências: nome + CPF informados, posse
do link pessoal, código por e-mail (opcional), IP, dispositivo, data/hora, hash
SHA-256 do original e do assinado, e trilha de eventos encadeada por hash.
O selo ICP-Brasil (e-CNPJ A1) tem gancho pronto em `pdf/seal.ts`.

## Arquitetura

```
server/esign/          núcleo — nenhuma dependência de React/Next
  deps.ts              ÚNICA fronteira com o app (banco, env, URL pública, e-mail, storage, logo)
  config.ts            limites (25 MB, TTLs), textos legais, dados da empresa
  crypto.ts            tokens 256 bits (só hash no banco), AES-256-GCM p/ "copiar link", OTP (HMAC)
  storage.ts           interface EsignStorage + Supabase Storage (bucket privado)
  documents.ts         criar (bytes/URL), rascunho, enviar, cancelar, links, arquivos
  signers.ts           página pública: abrir, identificar, OTP, assinar
  sessions.ts          QR de uso único: upload pelo celular e assinatura pelo dedo
  rendering.ts         regera signed.pdf dentro da transação (lock por documento)
  evidence.ts          trilha de auditoria encadeada (hash) + verifyAuditChain
  validation.ts        consulta pública por código
  fetch-url.ts         download de PDF por link com proteção SSRF
  pdf/                 inspect, geometry (rotação), render (carimbos), report, seal
  index.ts             fachada — o resto do app importa só daqui
```

Camadas finas por cima (sem regra de negócio):

| Quem | Onde | Auth |
|---|---|---|
| Painel admin | `app/admin/documentos/**` + `actions.ts` | `requireRole(["admin"])` |
| Página de assinatura | `app/(esign)/assinar/[token]` + `actions.ts` | token do link |
| Celular (QR) | `app/(esign)/m/upload/[code]`, `app/(esign)/m/assinatura/[code]` | código de uso único |
| Validação pública | `app/(marketing)/validar-documento` | pública (só código) |
| REST v1 | `app/api/esign/v1/**` | `Bearer ESIGN_API_KEY` |
| Bytes | `app/api/esign/{upload,files,s,phone-upload}` | conforme a rota |

Referência completa das rotas/actions: [api.md](api.md).

### Modelo de dados (migration `8_esign`)

`EsignDocument` → `EsignSigner` (link próprio, evidências, OTP) → `EsignField`
(posição **relativa 0..1** à página exibida) · `EsignEvent` (trilha com `prevHash`/`hash`)
· `EsignSession` (QR). Tudo prefixado `Esign*` e **sem FK para `User`** (o criador é
um snapshot `createdById/createdByName`) para o módulo poder ser extraído.

Fluxo de status: `draft` → `pending` (enviado) → `completed` (todos assinaram,
imutável) ou `cancelled`.

### Arquivos (Supabase Storage, bucket privado `esign`)

`docs/<código>/original.pdf`, `docs/<código>/signed.pdf` (regravado a cada
assinatura, sempre a partir do original), `docs/<código>/signatures/<signer>.png`,
`tmp/signatures/<sessão>.png`. O bucket é criado sozinho no primeiro upload.
**Nunca** expor URL do storage — os bytes saem pelas rotas com autorização.

### PDF final

`pdf/render.ts` carimba cada assinatura no campo (imagem + legenda "Assinado
eletronicamente por… · CPF mascarado · data/hora · código"), preenche campos de
nome/CPF/data, marca o rodapé de cada página e `pdf/report.ts` anexa o relatório.
Páginas com `/Rotate` são tratadas em `pdf/geometry.ts`. Fontes padrão (WinAnsi):
`pdf/text.ts` limpa caracteres que não existem nelas.

## Configuração (env)

| Variável | Obrigatória | Uso |
|---|---|---|
| `ESIGN_SECRET` | sim | Cifra os links e assina os códigos. **Não trocar** depois de enviar documentos (links antigos param de abrir). `openssl rand -base64 32` |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | Storage (service role) |
| `ESIGN_STORAGE_BUCKET` | não (`esign`) | Nome do bucket |
| `ESIGN_API_KEY` | não | Liga a REST v1 (vazia = 503) |
| `RESEND_API_KEY` + domínio verificado | p/ OTP | Sem domínio verificado o Resend só entrega ao dono da conta → **desligue "Exigir código por e-mail"** nos documentos até verificar |
| `ESIGN_CERT_P12_BASE64` / `ESIGN_CERT_PASSWORD` | futuro | Selo ICP-Brasil (A1) |

Como o banco é um só, dev e produção precisam do **mesmo** `ESIGN_SECRET`.

## PWA e "Compartilhar" do WhatsApp

`app/manifest.ts` + `public/sw.js`: o painel é instalável (menu do usuário →
**Instalar app**). No Android (Chrome/Edge), um PDF recebido no WhatsApp →
*Compartilhar* → **CG Painel** abre `/admin/documentos/novo` com o arquivo já
carregado. O SW guarda o arquivo no Cache API (não manda bytes anônimos ao
servidor) e sobrevive ao login. **iOS não suporta share target** — lá, use o
QR "Pelo celular". O SW não faz cache de páginas.

## Segurança

- Token do link: 256 bits; no banco só `sha256` (busca) + versão cifrada.
- OTP: 6 dígitos, HMAC, 10 min, 5 tentativas, reenvio 45 s / 3 a cada 15 min.
- Rate limit por IP em todas as ações públicas (`lib/rate-limit.ts`, em memória).
- CPF mascarado em tudo que é público (PDF, validação); completo só no admin.
- Documento concluído é imutável; cancelamento só por admin.
- Upload: magic bytes `%PDF-`, cifrado recusado, 25 MB; import por URL bloqueia
  IPs privados/loopback e revalida cada redirect.
- RLS: todas as tabelas `Esign*` têm RLS ligado sem policy (a chave anon não lê nada).

## Extrair para um produto próprio

1. Copie `server/esign/`, `lib/validations/esign.ts`, os modelos `Esign*` +
   `prisma/migrations/8_esign`, `app/(esign)/`, `app/api/esign/` e
   `components/esign/`.
2. Reimplemente **só** `server/esign/deps.ts` (Prisma, env, `publicBaseUrl`,
   `sendEmail`, cliente de storage, logo, `actorEmail`).
3. Troque `SupabaseEsignStorage` se quiser outro storage (interface `EsignStorage`).
4. O painel do LMS pode passar a consumir a REST v1 em vez das Server Actions.

## Pendências / futuro

- Word → PDF (Gotenberg no Coolify); `originalMime` + `CONVERTIBLE_MIMES` são o gancho.
- Selo ICP-Brasil A1 (`@signpdf`) em `pdf/seal.ts`.
- WhatsApp Business Cloud API (receber documentos automaticamente no número da empresa).
- Assinatura sequencial (`EsignSigner.order` já existe) e webhooks da REST.
