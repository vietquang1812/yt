FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
COPY apps/bull-board ./apps/bull-board
WORKDIR /app/apps/bull-board
RUN pnpm install --prod
EXPOSE 4000
CMD ["pnpm","start"]
