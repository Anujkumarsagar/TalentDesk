import { Router } from "express";
import { authenticate, requireRecruiter } from "../middleware/auth";
import * as candidateService from "../services/candidate.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const candidatesRouter = Router();
candidatesRouter.use(authenticate);

const num = (value: any) =>
  value === undefined || value === null || value === "" ? undefined : Number(value);

candidatesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = req.query as any;
    res.json(
      await candidateService.listCandidates({
        jobId: q.jobId || undefined,
        job: q.job || undefined,
        stage: q.stage || undefined,
        search: q.search || undefined,
        page: Number(q.page) || 1,
        limit: Number(q.limit) || 20,
      }),
    );
  }),
);

candidatesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const candidate = await candidateService.getCandidate(String(req.params.id));
    if (!candidate) throw ApiError.notFound("Candidate not found");
    res.json({ candidate });
  }),
);

candidatesRouter.post(
  "/",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const body = req.body;
    const data = {
      name: body.name,
      email: body.email,
      phone: body.phone || undefined,
      jobId: body.jobId,
      stage: body.stage || "APPLIED",
      currentCtc: num(body.currentCtc),
      expectedCtc: num(body.expectedCtc),
      noticeDays: num(body.noticeDays),
    };
    res.status(201).json({ candidate: await candidateService.createCandidate(data) });
  }),
);

candidatesRouter.patch(
  "/:id",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const body = req.body;
    const data = {
      name: body.name,
      email: body.email,
      phone: body.phone || undefined,
      jobId: body.jobId,
      stage: body.stage,
      currentCtc: num(body.currentCtc),
      expectedCtc: num(body.expectedCtc),
      noticeDays: num(body.noticeDays),
    };
    res.json({ candidate: await candidateService.updateCandidate(String(req.params.id), data) });
  }),
);

candidatesRouter.delete(
  "/:id",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    if (!(await candidateService.deleteCandidate(String(req.params.id)))) {
      throw ApiError.notFound("Candidate not found");
    }
    res.status(204).end();
  }),
);

candidatesRouter.post(
  "/:id/move-stage",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const { toStage } = req.body;
    const candidate = await candidateService.moveStage(String(req.params.id), toStage, req.user!.id);
    res.json({ candidate });
  }),
);
