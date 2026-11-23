import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { answerQuestion } from "../services/chat.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const chatRouter = Router();
chatRouter.use(authenticate);

chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const message = String(req.body?.message)?.trim();
    if (!message) throw ApiError.badRequest("Message is required");
    res.json(await answerQuestion(message, req.user!.role));
  }),
);
