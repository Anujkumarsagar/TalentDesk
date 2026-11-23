import type { CandidateStage, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getPage, paginated } from "../utils/pagination";
import { ApiError } from "../utils/ApiError";

export interface ListCandidatesParams {
  jobId?: string;
  job?: string;
  stage?: CandidateStage;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listCandidates(params: ListCandidatesParams) {
  const pageInfo = getPage(params.page, params.limit);
  const where: Prisma.CandidateWhereInput = {
    ...(params.jobId ? { jobId: params.jobId } : {}),
    ...(params.job
      ? { job: { title: { contains: params.job, mode: "insensitive" as const } } }
      : {}),
    ...(params.stage ? { stage: params.stage } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" as const } },
            { email: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip: pageInfo.skip,
      take: pageInfo.limit,
      orderBy: { createdAt: "desc" },
      include: { job: { select: { id: true, title: true } } },
    }),
    prisma.candidate.count({ where }),
  ]);

  return paginated(candidates, total, pageInfo);
}

export async function getCandidate(id: string) {
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true } },
      stageEvents: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export type CreateCandidateInput = {
  name: string;
  email: string;
  phone?: string;
  currentCtc?: number;
  expectedCtc?: number;
  noticeDays?: number;
  jobId: string;
  stage: CandidateStage;
};

export async function createCandidate(data: CreateCandidateInput) {
  const job = await prisma.job.findUnique({ where: { id: data.jobId }, select: { id: true } });
  if (!job) throw ApiError.badRequest("Unknown jobId");
  return prisma.candidate.create({ data });
}

export type UpdateCandidateInput = Partial<CreateCandidateInput>;

export async function updateCandidate(id: string, data: UpdateCandidateInput) {
  if (data.jobId) {
    const job = await prisma.job.findUnique({ where: { id: data.jobId }, select: { id: true } });
    if (!job) throw ApiError.badRequest("Unknown jobId");
  }

  const existing = await prisma.candidate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("Candidate not found");

  return prisma.candidate.update({ where: { id }, data });
}

export async function deleteCandidate(id: string) {
  const existing = await prisma.candidate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await prisma.candidate.delete({ where: { id } });
  return true;
}

/**
 * Changes a candidate's stage and appends exactly one StageEvent.
 * Both writes happen in a single database transaction.
 */
export async function moveStage(
  id: string,
  toStage: CandidateStage,
  changedById: string,
) {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.findUnique({ where: { id } });
    if (!candidate) throw ApiError.notFound("Candidate not found");
    if (candidate.stage === toStage) {
      throw ApiError.badRequest(`Candidate is already in stage ${toStage}`);
    }

    const updated = await tx.candidate.update({
      where: { id },
      data: { stage: toStage },
    });

    await tx.stageEvent.create({
      data: {
        candidateId: id,
        fromStage: candidate.stage,
        toStage,
        changedById,
      },
    });

    return updated;
  });
}
