FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace
COPY package.json pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY configs ./configs

# IMPORTANT: install with dev deps so tsc exists
ENV NODE_ENV=development
RUN pnpm install --prod=false
RUN pnpm --filter @yt-ai/db prisma:generate
RUN pnpm --filter @yt-ai/db build
RUN pnpm --filter worker build
# Build worker

ENV NODE_ENV=production
CMD ["node","apps/worker/dist/main.js"]
