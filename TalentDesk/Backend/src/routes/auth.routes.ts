import { Router } from "express";
import { prisma } from "../config/prisma";
import { authenticate } from "../middleware/auth";
import { comparePassword, signToken } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw ApiError.badRequest("Email and password are required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

authRouter.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});
