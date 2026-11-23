import { Queue } from "bullmq";
import type { Queue as QueueType } from "bullmq";
import { createBullRedis } from "../config/redis";
import { INGESTION_QUEUE } from "./constants";

let queue: QueueType | null = null;

/** The queue is created on first use so the API can start without Redis. */
function getQueue(): QueueType {
  if (!queue) {
    queue = new Queue(INGESTION_QUEUE, { connection: createBullRedis() });
  }
  return queue;
}

export async function enqueueIngestion(documentId: string) {
  await getQueue().add(
    "ingest",
    { documentId },
    { attempts: 2, backoff: { type: "exponential", delay: 2000 } },
  );
}

export async function closeIngestionQueue() {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
