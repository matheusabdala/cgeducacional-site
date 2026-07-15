---
name: api-docs
description: Mantém docs/api.md em sincronia com a superfície de API do LMS. Use SEMPRE que criar, alterar ou remover um Route Handler (app/api/**/route.ts) ou uma Server Action (app/**/actions.ts) — e ao começar uma tarefa que mexa em API, leia docs/api.md primeiro para ter o contexto fresco das rotas, auth e convenções.
---

# API Docs — doc viva da superfície de API

O arquivo [`docs/api.md`](../../../docs/api.md) é a **fonte de verdade** da API do
LMS (Route Handlers + Server Actions) e serve de contexto para o Claude em toda
sessão. Ele só é útil se acompanhar o código. Esta skill descreve como mantê-lo.

## Quando esta skill se aplica

- **Antes** de trabalhar em qualquer coisa de API: leia `docs/api.md` para carregar
  as rotas existentes, os helpers de auth/acesso e as convenções do projeto.
- **Depois** de qualquer mudança que afete a superfície de API — na **mesma**
  alteração/commit, não deixe para depois.

## O que conta como mudança de API (gatilhos para atualizar `docs/api.md`)

Atualize a doc quando você:

1. Criar, renomear, mover ou deletar um arquivo `app/api/**/route.ts`.
2. Adicionar/remover um método HTTP (`GET`/`POST`/…) num Route Handler.
3. Mudar o contrato de uma rota: params de path, query string, corpo, headers,
   códigos de status, formato de resposta ou regra de auth.
4. Adicionar, remover ou renomear uma **Server Action** exportada de um
   `app/**/actions.ts` (ou mudar seu papel/assinatura pública).
5. Mudar uma regra transversal: helper de auth (`@/lib/auth`), acesso a conteúdo
   (`@/lib/access`), abstração de mídia (`@/server/media`), rate limit, ou o
   `middleware.ts` (prefixos protegidos, redirects).

Refatoração interna que **não** muda o contrato externo não exige update — mas na
dúvida, atualize.

## Como atualizar

1. Edite a seção certa de `docs/api.md`:
   - Route Handlers → tabela-resumo **e** a subseção da rota.
   - Server Actions → a tabela do grupo (`Auth`, `Admin · Cursos`, `Aluno ·
     Progresso`, `Checkout`, etc.). Crie um grupo novo se surgir uma área nova.
2. Mantenha o estilo existente: conciso, em pt-BR, com o caminho do arquivo, auth,
   params relevantes e os códigos de status que importam. Não cole o código inteiro.
3. Atualize a linha **"Última verificação contra o código: commit `XXXXXXX`"** no
   topo com o `git rev-parse --short HEAD` atual (ou o commit que sua mudança vai
   gerar).
4. Confira que a doc segue as convenções reais do projeto (ver [CLAUDE.md](../../../CLAUDE.md)):
   lógica de negócio em Server Actions; Route Handlers só para HTTP cru
   (streaming, upload, webhook, health); mídia sempre via provider; Zod na entrada;
   segredos server-side.

## Verificação rápida de que a doc está completa

Liste a API real e confira contra a doc:

```bash
# Route Handlers
find app/api -name route.ts | sort
# Server Actions (arquivos)
find app -name 'actions.ts' -o -name '*-actions.ts' | sort
# Métodos exportados por um handler
grep -nE 'export async function (GET|POST|PUT|PATCH|DELETE)' app/api/**/route.ts
```

Toda rota/arquivo listado deve aparecer em `docs/api.md`. Se aparecer algo na
listagem que não está na doc (ou vice-versa), reconcilie.
