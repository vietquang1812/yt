# yt-ai-system-full (Local runnable MVP)

## Docker quickstart
```bash
mkdir -p storage/projects
docker compose up -d --build
docker compose run --rm orchestrator-api sh -lc "pnpm prisma:migrate:deploy"
```

URLs:
- API: http://localhost:3000
- Health: http://localhost:3000/health
- Bull Board: http://localhost:4000
- pgAdmin: http://localhost:5050 (admin@local.dev / admin)

## Local run (no Docker)
Prereqs: Node 20+, pnpm, Postgres, Redis, ffmpeg
```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate:dev

pnpm dev:api
# in another terminal:
pnpm dev:worker
# in another terminal:
pnpm dev:bull
```
