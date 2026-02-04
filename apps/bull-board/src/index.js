import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 4000);
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

// Orchestrator API base (docker dùng http://orchestrator-api:3000)
const ORCH_API = process.env.ORCH_API || "http://localhost:3000";

const connection = new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null
});

const names = ["pipeline", "llm", "assets", "media"];
const queues = names.map((n) => new Queue(n, { connection }));

// Bull board mounts at /queues
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/queues");
createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter
});

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------
// Admin static pages
// --------------------
app.use("/admin", express.static(path.join(__dirname, "../public/admin")));

const ADMIN_UI = process.env.ADMIN_UI || "http://localhost:4100";
// thay vì express.static("/admin"...)
app.use("/admin", async (req, res) => {
  const url = `${ADMIN_UI}${req.originalUrl.replace(/^\/admin/, "") || "/"}`;
  const r = await fetch(url, { method: req.method, headers: req.headers });
  const buf = await r.arrayBuffer();
  res.status(r.status);
  r.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(Buffer.from(buf));
});

// root redirect
app.get("/", (_req, res) => res.redirect("/admin/projects"));
// --------------------
// Admin API proxy -> orchestrator-api
// --------------------
async function proxy(req, res, targetPath, options = {}) {
    const url = `${ORCH_API}${targetPath}`;
    const r = await fetch(url, {
        method: options.method || "GET",
        headers: { "content-type": "application/json" },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await r.text();
    res.status(r.status).send(text);
}
app.get("/admin/api/series", (req, res) => proxy(req, res, `/series`));
app.get("/admin/api/series/:id", (req, res) => proxy(req, res, `/series/${req.params.id}`));
app.post("/admin/api/series", (req, res) => proxy(req, res, `/series`, { method: "POST", body: req.body }));

app.get("/admin/api/projects", (req, res) => proxy(req, res, `/projects`));
app.post("/admin/api/projects", (req, res) =>
  proxy(req, res, "/projects", { method: "POST", body: req.body })
);
app.get("/admin/api/projects/:id", (req, res) => proxy(req, res, `/projects/${req.params.id}`));
app.get("/admin/api/projects/:id/artifacts", (req, res) =>
    proxy(req, res, `/projects/${req.params.id}/artifacts`)
);
app.get("/admin/api/projects/:id/artifacts/:artifactId/content", (req, res) =>
    proxy(req, res, `/projects/${req.params.id}/artifacts/${req.params.artifactId}/content`)
);
app.post("/admin/api/projects/:id/run", (req, res) =>
    proxy(req, res, `/projects/${req.params.id}/run`, { method: "POST" })
);
app.post("/admin/api/projects/:id/refine", (req, res) =>
    proxy(req, res, `/projects/${req.params.id}/refine`, { method: "POST" })
);
app.post("/admin/api/projects/:id/status", (req, res) =>
  proxy(req, res, `/projects/${req.params.id}/status`, { method: "POST", body: req.body })
);
// --------------------
// Bull board UI
// --------------------
app.use("/queues", serverAdapter.getRouter());

// app.get("/", (_req, res) => res.redirect("/admin/projects.html"));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Admin http://localhost:${PORT}/admin/projects.html | Queues http://localhost:${PORT}/queues`));
