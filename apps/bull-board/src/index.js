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

// ✅ CHỈ proxy admin-ui nếu set ADMIN_UI (không default localhost:4100)
const ADMIN_UI = process.env.ADMIN_UI; // undefined => dùng static admin

const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

const names = ["pipeline", "llm", "assets", "media"];
const queues = names.map((n) => new Queue(n, { connection }));

// Bull board mounts at /queues
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/queues");
createBullBoard({
  queues: queues.map((q) => new BullMQAdapter(q)),
  serverAdapter,
});

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------
// Admin API proxy -> orchestrator-api
// (Đặt TRƯỚC /admin static/proxy để tránh bị "ăn" route)
// --------------------
async function proxy(_req, res, targetPath, options = {}) {
  const url = `${ORCH_API}${targetPath}`;
  const r = await fetch(url, {
    method: options.method || "GET",
    headers: { "content-type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await r.text();
  res.status(r.status).send(text);
}

app.get("/admin/api/series", (req, res) => proxy(req, res, `/series`));
app.get("/admin/api/series/:id", (req, res) => proxy(req, res, `/series/${req.params.id}`));
app.post("/admin/api/series", (req, res) =>
  proxy(req, res, `/series`, { method: "POST", body: req.body })
);
app.patch("/admin/api/series/:id", (req, res) =>
  proxy(req, res, `/series/${req.params.id}`, { method: "PATCH", body: req.body })
);

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

app.post("/admin/api/projects/:id/segments", (req, res) =>
  proxy(req, res, `/projects/${req.params.id}/segments`, { method: "POST" })
);
// --------------------
// Admin UI pages
// --------------------

// 1) Static admin pages (default)
app.use("/admin", express.static(path.join(__dirname, "../public/admin")));

// 2) Optional proxy to Next.js admin-ui if ADMIN_UI is set
if (ADMIN_UI) {
  app.use("/admin", async (req, res) => {
    try {
      const url = `${ADMIN_UI}${req.originalUrl.replace(/^\/admin/, "") || "/"}`;
      const r = await fetch(url, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
      });
      const buf = await r.arrayBuffer();
      res.status(r.status);
      r.headers.forEach((v, k) => res.setHeader(k, v));
      res.send(Buffer.from(buf));
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: "ADMIN_UI_PROXY_FAILED",
        admin_ui: ADMIN_UI,
        message: String(e?.message ?? e),
      });
    }
  });
}

// root redirect
app.get("/", (_req, res) => res.redirect("/admin/projects.html"));

// --------------------
// Bull board UI
// --------------------
app.use("/queues", serverAdapter.getRouter());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(
    `Admin http://localhost:${PORT}/admin/projects.html | Queues http://localhost:${PORT}/queues`
  );
  console.log(`ORCH_API=${ORCH_API}`);
  console.log(`ADMIN_UI=${ADMIN_UI || "(static)"} `);
});
