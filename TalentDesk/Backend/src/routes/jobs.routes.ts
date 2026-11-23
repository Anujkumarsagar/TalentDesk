import { Router } from "express";
import { authenticate, requireRecruiter } from "../middleware/auth";
import * as jobService from "../services/job.service";
import * as candidateService from "../services/candidate.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const jobsRouter = Router();
jobsRouter.use(authenticate);

jobsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = req.query as any;
    res.json(
      await jobService.listJobs({
        search: q.search || undefined,
        status: q.status || undefined,
        page: Number(q.page) || 1,
        limit: Number(q.limit) || 20,
      }),
    );
  }),
);

jobsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await jobService.getJob(String(req.params.id));
    if (!job) throw ApiError.notFound("Job not found");
    res.json({ job });
  }),
);

jobsRouter.get(
  "/:id/candidates",
  asyncHandler(async (req, res) => {
    const q = req.query as any;
    res.json(
      await candidateService.listCandidates({
        jobId: String(req.params.id),
        stage: q.stage || undefined,
        job: q.job || undefined,
        search: q.search || undefined,
        page: Number(q.page) || 1,
        limit: Number(q.limit) || 20,
      }),
    );
  }),
);

jobsRouter.post(
  "/",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    const body = req.body;
    res.status(201).json({
      job: await jobService.createJob({
        ...body,
        openings: Number(body.openings) || 1,
        status: body.status || "OPEN",
      }),
    });
  }),
);

jobsRouter.patch(
  "/:id",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    res.json({ job: await jobService.updateJob(String(req.params.id), req.body) });
  }),
);

jobsRouter.delete(
  "/:id",
  requireRecruiter,
  asyncHandler(async (req, res) => {
    if (!(await jobService.deleteJob(String(req.params.id)))) throw ApiError.notFound("Job not found");
    res.status(204).end();
  }),
);
