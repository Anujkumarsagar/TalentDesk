import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface JwtPayload extends AuthUser {
  iat: number;
  exp: number;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  );
}

export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}
