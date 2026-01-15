import express from "express";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const PORT = Number(process.env.PORT || 4000);
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

const connection = new IORedis({ host: REDIS_HOST, port: REDIS_PORT, maxRetriesPerRequest: null });
const names = ["pipeline","llm","assets","media"];
const queues = names.map((n)=> new Queue(n, { connection }));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");
createBullBoard({ queues: queues.map((q)=> new BullMQAdapter(q)), serverAdapter });

const app = express();
app.use("/", serverAdapter.getRouter());
app.get("/health", (_,res)=>res.json({ok:true}));
app.listen(PORT, ()=>console.log(`Bull Board http://localhost:${PORT}`));
