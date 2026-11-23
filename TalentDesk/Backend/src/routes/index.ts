import { Router } from "express";
import { authRouter } from "./auth.routes";
import { candidatesRouter } from "./candidates.routes";
import { chatRouter } from "./chat.routes";
import { documentsRouter } from "./documents.routes";
import { jobsRouter } from "./jobs.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/jobs", jobsRouter);
apiRouter.use("/candidates", candidatesRouter);
apiRouter.use("/documents", documentsRouter);
apiRouter.use("/chat", chatRouter);
