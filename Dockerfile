# ---- Dependências ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Schema do Prisma antes do install (o postinstall roda `prisma generate`).
COPY prisma ./prisma
# `npm install` (não `npm ci`): resolve as variantes opcionais por plataforma
# (ex.: @emnapi musl no Alpine) que o lockfile gerado em glibc/x64 não traz.
RUN npm install --no-audit --no-fund

# ---- Build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Variáveis NEXT_PUBLIC_* precisam existir no build (são inlined no bundle).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=$NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Aplica as migrations do Prisma no banco (Supabase) durante o build — o
# container alcança o banco via pooler. Idempotente (migrate deploy pula as já
# aplicadas). DATABASE_URL/DIRECT_URL vêm como build-args do Coolify.
ARG DATABASE_URL
ARG DIRECT_URL
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
# Aplica as migrations com retry (P1001 do pooler costuma ser transiente).
# Não-fatal só como último recurso, p/ não bloquear a landing num apagão de DB.
RUN npx prisma migrate deploy \
  || (echo "[migrate] retry 1 em 8s…" && sleep 8 && npx prisma migrate deploy) \
  || (echo "[migrate] retry 2 em 20s…" && sleep 20 && npx prisma migrate deploy) \
  || echo "[build] AVISO: migrate deploy nao aplicado (verifique DATABASE_URL/DIRECT_URL)"

# Popula cursos de demonstração só se o catálogo estiver vazio (não-fatal).
RUN npx tsx prisma/seed-if-empty.ts || echo "[build] seed-if-empty pulado"

RUN npm run build

# ---- Runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Saída standalone: server mínimo + apenas deps usadas.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Engine do Prisma (o trace do standalone não copia o binário sozinho).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck via node (o alpine não traz curl/wget confiável). Bate em
# /api/health; start-period dá tempo do Next subir antes de contar falha.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "const http=require('http');const r=http.get('http://127.0.0.1:3000/api/health',x=>process.exit(x.statusCode===200?0:1));r.on('error',()=>process.exit(1));r.setTimeout(4000,()=>{r.destroy();process.exit(1)})"

CMD ["node", "server.js"]
