# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app/worker
COPY worker/package.json worker/package-lock.json* ./
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app/worker
ENV NODE_ENV=production
COPY --from=deps /app/worker/node_modules ./node_modules
COPY worker/ ./
# tsx runs the TypeScript entrypoint directly; it's a dependency of the worker.
RUN npm install tsx
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 worker
USER worker
CMD ["npx", "tsx", "src/index.ts"]
