import { randomUUID } from "node:crypto";
import { mkdirSync, unlink } from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { authenticate, requireRecruiter } from "../middleware/auth";
import { enqueueIngestion } from "../rag/queue";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

mkdirSync(env.UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: env.UPLOAD_DIR,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed =
      extension === ".pdf" ||
      extension === ".txt" ||
      extension === ".md" ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/plain";
    if (allowed) callback(null, true);
    else callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
  },
});

export const documentsRouter = Router();
documentsRouter.use(authenticate);

documentsRouter.post(
  "/",
  requireRecruiter,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("A PDF or text file is required");
    const jobId = (req.body as { jobId?: string }).jobId || undefined;

    const document = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        jobId,
        uploadedById: req.user!.id,
      },
    });

    try {
      await enqueueIngestion(document.id);
    } catch (error) {
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "FAILED",
          errorMessage: "Could not queue ingestion job",
        },
      });
      throw error;
    }

    res.status(202).json({ document });
  }),
);

documentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        originalName: true,
        status: true,
        errorMessage: true,
        jobId: true,
        createdAt: true,
      },
    });
    res.json({ documents });
  }),
);

documentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({
      where: { id: String(req.params.id) },
      include: { _count: { select: { chunks: true } } },
    });
    if (!document) throw ApiError.notFound("Document not found");
    res.json({ document });
  }),
);

documentsRouter.delete(
  "/:id",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({ where: { id: String(req.params.id) } });
    if (!document) throw ApiError.notFound("Document not found");

    await prisma.document.delete({ where: { id: String(req.params.id) } });
    await unlink(document.path, () => undefined);
    res.status(204).end();
  }),
);
