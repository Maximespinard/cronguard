# ── Stage 1: Install dependencies ─────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package.json files (needed for npm ci resolution)
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --omit=dev

# ── Stage 2: Build ────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/

RUN npm ci
RUN npm run typecheck --workspace=packages/shared --workspace=apps/api
RUN npm run build --workspace=packages/shared --workspace=apps/api

# Ensure drizzle dir exists (may not have generated migrations yet)
RUN mkdir -p apps/api/drizzle

# ── Stage 3: Production ──────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S cronguard && \
    adduser -S cronguard -u 1001 -G cronguard

# Copy production node_modules from deps stage (hoisted to root)
COPY --from=deps /app/node_modules ./node_modules

# Copy built output
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/package.json ./package.json

# Copy drizzle migrations
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle

USER cronguard

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
