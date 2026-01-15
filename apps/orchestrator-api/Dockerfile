FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace manifests trước để tận dụng cache
COPY package.json pnpm-workspace.yaml ./
# (nếu bạn có pnpm-lock.yaml thì copy luôn)
# COPY pnpm-lock.yaml ./

# Copy source
COPY apps ./apps
COPY packages ./packages
COPY configs ./configs

# IMPORTANT: cần devDependencies để có prisma CLI
ENV NODE_ENV=development
RUN pnpm install --prod=false
RUN pnpm --filter @yt-ai/db prisma:generate
# Prisma generate + build
# RUN pnpm --filter orchestrator-api prisma:generate
RUN pnpm --filter orchestrator-api build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","apps/orchestrator-api/dist/main.js"]
