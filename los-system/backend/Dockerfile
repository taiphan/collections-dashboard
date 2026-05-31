FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY . .

# Development
FROM base AS development
CMD ["npm", "run", "dev"]

# Build
FROM base AS build
RUN npm run build

# Production
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/server.js"]
