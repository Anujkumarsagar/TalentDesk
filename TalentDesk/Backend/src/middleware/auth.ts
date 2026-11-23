import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyToken } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing Bearer token"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  req.user = verifyToken(token);
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`Requires role: ${roles.join(" or ")}`));
      return;
    }
    next();
  };
}

export const requireRecruiter = requireRole("RECRUITER");
