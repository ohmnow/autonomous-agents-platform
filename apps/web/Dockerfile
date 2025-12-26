# syntax=docker/dockerfile:1
# Dockerfile for Next.js app in pnpm monorepo

# ============================================================================
# Stage 1: Base image with pnpm
# ============================================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ============================================================================
# Stage 2: Install dependencies
# ============================================================================
FROM base AS deps

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/agent-core/package.json ./packages/agent-core/
COPY packages/database/package.json ./packages/database/
COPY packages/sandbox-providers/package.json ./packages/sandbox-providers/
COPY packages/storage/package.json ./packages/storage/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================================================
# Stage 3: Build packages and app
# ============================================================================
FROM base AS builder

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/agent-core/node_modules ./packages/agent-core/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/sandbox-providers/node_modules ./packages/sandbox-providers/node_modules
COPY --from=deps /app/packages/storage/node_modules ./packages/storage/node_modules

# Copy all source code
COPY . .

# Generate Prisma client
RUN cd packages/database && pnpm exec prisma generate

# Build all packages (turbo will handle order)
RUN pnpm run build

# ============================================================================
# Stage 4: Production runner
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl openssl-dev libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy Prisma schema, client, and migrations for runtime
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma

# Copy migration script and make it executable
COPY --from=builder /app/apps/web/migrate.sh ./migrate.sh
RUN chmod +x ./migrate.sh

# Install Prisma CLI for migrations (release command needs it)
RUN npm install -g prisma@5.22.0

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]

