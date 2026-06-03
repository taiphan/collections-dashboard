# syntax=docker/dockerfile:1

# ---- deps ----------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ---------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js projects without static assets still need public/ for the runtime image.
RUN mkdir -p public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- migrate (full deps + scripts; used by the migrate compose job) ------
FROM node:20-alpine AS migrate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY src ./src
CMD ["node", "scripts/migrate.mjs"]

# ---- runtime -------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3020
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone output ships its own minimal server + traced deps.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Migrations are applied by an init job / entrypoint, ship them too.
COPY --from=build /app/drizzle ./drizzle

USER nextjs
EXPOSE 3020

# The standalone server entrypoint is server.js at the app root.
CMD ["node", "server.js"]
