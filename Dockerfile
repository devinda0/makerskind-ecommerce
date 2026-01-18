FROM node:20-alpine AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files
# TanStack Start / Nitro outputs to .output
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
COPY .env.production ./.env

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
