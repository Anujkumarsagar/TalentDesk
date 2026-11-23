import { Worker } from "bullmq";
import { createBullRedis } from "../config/redis";
import { prisma } from "../config/prisma";
import { INGESTION_QUEUE } from "../rag/constants";
import { ingestDocument } from "../rag/ingest";

const worker = new Worker(
  INGESTION_QUEUE,
  async (job) => {
    if (job.name !== "ingest") return;
    const documentId = (job.data as { documentId: string }).documentId;
    await ingestDocument(documentId);
  },
  { connection: createBullRedis(), concurrency: 2 },
);

worker.on("completed", (job) => console.log(`[worker] ingested ${job.data.documentId}`));
worker.on("failed", (job, error) =>
  console.error(`[worker] failed ${job?.data.documentId}: ${error.message}`),
);
console.log("[worker] document ingestion worker started");

async function shutdown() {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
