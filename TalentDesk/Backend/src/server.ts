import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { closeIngestionQueue } from "./rag/queue";

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`TalentDesk API listening on http://localhost:${env.PORT}`);
});

async function shutdown() {
  server.close();
  await closeIngestionQueue();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
