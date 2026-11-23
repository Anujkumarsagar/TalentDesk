import type { Job, JobStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getPage, paginated } from "../utils/pagination";
import { stages } from "../constants";

type StageCounts = Record<string, number>;

function emptyStageCounts() {
  return Object.fromEntries(stages.map((stage) => [stage, 0]));
}

function countsByJob(
  grouped: Array<{ jobId: string; stage: string; _count: { _all: number } }>,
) {
  const result = new Map<string, StageCounts>();
  for (const row of grouped) {
    const counts = result.get(row.jobId) ?? emptyStageCounts();
    counts[row.stage] = row._count._all;
    result.set(row.jobId, counts);
  }
  return result;
}

export interface ListJobsParams {
  status?: JobStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listJobs(params: ListJobsParams) {
  const pageInfo = getPage(params.page, params.limit);
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" as const } },
            { clientName: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [jobs, total, grouped] = await Promise.all([
    prisma.job.findMany({
      where,
      skip: pageInfo.skip,
      take: pageInfo.limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { candidates: true } } },
    }),
    prisma.job.count({ where }),
    prisma.candidate.groupBy({
      by: ["jobId", "stage"],
      _count: { _all: true },
    }),
  ]);

  const counts = countsByJob(grouped);
  return paginated(
    jobs.map((job) => ({
      ...job,
      candidateCount: job._count.candidates,
      stageCounts: counts.get(job.id) ?? emptyStageCounts(),
    })),
    total,
    pageInfo,
  );
}

export async function getJob(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { _count: { select: { candidates: true } } },
  });
  if (!job) return null;

  const grouped = await prisma.candidate.groupBy({
    by: ["stage"],
    where: { jobId: id },
    _count: { _all: true },
  });

  const stageCounts = emptyStageCounts();
  for (const row of grouped) stageCounts[row.stage] = row._count._all;

  return { ...job, candidateCount: job._count.candidates, stageCounts };
}

export type CreateJobInput = Pick<Job, "title" | "clientName" | "location" | "openings" | "status">;

export function createJob(data: CreateJobInput) {
  return prisma.job.create({ data });
}

export type UpdateJobInput = Partial<CreateJobInput>;

export function updateJob(id: string, data: UpdateJobInput) {
  return prisma.job.update({ where: { id }, data });
}

export async function deleteJob(id: string) {
  const existing = await prisma.job.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await prisma.job.delete({ where: { id } });
  return true;
}
