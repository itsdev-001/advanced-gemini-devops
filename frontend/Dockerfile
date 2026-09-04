# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Base Image (Lightweight Node.js 20 LTS on Alpine Linux)
# ==============================================================================
FROM node:20-alpine AS base
WORKDIR /app
# Install libc6-compat for Alpine compatibility with native Next.js bindings
RUN apk add --no-cache libc6-compat

# ==============================================================================
# Stage 2: Dependencies Installation
# ==============================================================================
FROM base AS deps
WORKDIR /app

# Copy package manifests for efficient layer caching
COPY package.json package-lock.json ./
RUN npm ci

# ==============================================================================
# Stage 3: Next.js Production Builder
# ==============================================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==============================================================================
# Stage 4: Production Runner (Minimal runtime, Non-root execution)
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Apply latest Alpine security patches and remove unnecessary global package managers
RUN apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /root/.npm /root/.cache

# Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Configure pre-render caching directory with proper ownership
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build artifacts, public assets, and static bundle
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to unprivileged user
USER nextjs

EXPOSE 3000

# Docker Healthcheck targeting application health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Launch standalone Next.js server
CMD ["node", "server.js"]

