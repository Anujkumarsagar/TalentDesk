import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
