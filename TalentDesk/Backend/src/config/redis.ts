import Redis from "ioredis";
import { env } from "./env";

/** BullMQ requires maxRetriesPerRequest to be null for blocking connections. */
export function createBullRedis(): Redis {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
  let logged = false;
  connection.on("error", (error: Error) => {
    if (!logged) {
      console.error("[redis]", error.message);
      logged = true;
    }
  });
  return connection;
}
