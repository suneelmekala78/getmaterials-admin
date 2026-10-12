# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# GetMaterials Admin — multi-stage production image (Next.js standalone)
# Build-time env comes from the `app_env` BuildKit secret (NEXT_PUBLIC_* are
# inlined into the bundle). Runtime .env is injected via --env-file.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20.19.2-alpine3.21 AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

FROM node:20.19.2-alpine3.21 AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=secret,id=app_env,required=false \
    node scripts/write-runtime-env.mjs /run/secrets/app_env \
 && npm run build \
 && rm -f .env.production .next/standalone/.env*

FROM node:20.19.2-alpine3.21 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Unauthenticated requests redirect to /login, which renders without the API.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login >/dev/null || exit 1

CMD ["node", "server.js"]
