# ELITZE Agentic Security — production container
# Build from the repository root:
#   docker build -f deploy/Dockerfile -t elitze-agentic-security:latest .

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public build-time values (safe defaults; override with --build-arg)
ARG NEXT_PUBLIC_SITE_URL=https://elitze.ca
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID=
ARG NEXT_PUBLIC_GOOGLE_ADS_ID=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
    NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID \
    NEXT_PUBLIC_GOOGLE_ADS_ID=$NEXT_PUBLIC_GOOGLE_ADS_ID
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S elitze -u 1001

# Next.js standalone server (includes only the needed node_modules)
COPY --from=build --chown=elitze:nodejs /app/.next/standalone ./
COPY --from=build --chown=elitze:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=elitze:nodejs /app/public ./public

# Database migrations + migration runner (run once per deploy)
COPY --from=build --chown=elitze:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=elitze:nodejs /app/scripts ./scripts
COPY --from=build --chown=elitze:nodejs /app/node_modules/pg ./node_modules/pg
COPY --from=build --chown=elitze:nodejs /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=build --chown=elitze:nodejs /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=build --chown=elitze:nodejs /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=build --chown=elitze:nodejs /app/node_modules/pg-int8 ./node_modules/pg-int8
COPY --from=build --chown=elitze:nodejs /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=build --chown=elitze:nodejs /app/node_modules/pg-cloudflare ./node_modules/pg-cloudflare
COPY --from=build --chown=elitze:nodejs /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=build --chown=elitze:nodejs /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=build --chown=elitze:nodejs /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=build --chown=elitze:nodejs /app/node_modules/postgres-interval ./node_modules/postgres-interval

USER elitze
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
