import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound("Endpoint not found"));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: "Upload failed", details: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "A record with that unique value already exists" });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    if (error.code === "P2003") {
      res.status(400).json({ error: "Related record does not exist" });
      return;
    }
  }

  console.error("[error]", error);
  res.status(500).json({ error: "Internal server error" });
}
