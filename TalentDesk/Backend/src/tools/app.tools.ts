import type { Role } from "@prisma/client";
import { tool } from "@langchain/core/tools";
import { prisma } from "../config/prisma";
import { stages } from "../constants";

function assertReadable(role: Role) {
  if (role !== "RECRUITER" && role !== "VIEWER") {
    throw new Error("Not authorized to query application data");
  }
}

function candidateWhere(input: any) {
  return {
    ...(input.jobTitle
      ? { job: { title: { contains: input.jobTitle, mode: "insensitive" as const } } }
      : {}),
    ...(input.stage ? { stage: input.stage } : {}),
    ...(input.maxNoticeDays !== undefined
      ? { noticeDays: { lte: input.maxNoticeDays } }
      : {}),
  };
}

const candidateFilters = {
  jobTitle: { type: "string", description: "Job title, e.g. Python Developer" },
  stage: { type: "string", enum: stages, description: "Candidate stage" },
  maxNoticeDays: { type: "integer", description: "Maximum notice period in days" },
} as const;

export function createAppTools(role: Role) {
  const countCandidates = tool(
    async (input: any) => {
      assertReadable(role);
      const count = await prisma.candidate.count({ where: candidateWhere(input) });
      return `Count: ${count}`;
    },
    {
      name: "count_candidates",
      description:
        "Count candidates, optionally filtered by job title, stage, or maximum notice days.",
      schema: { type: "object", properties: candidateFilters } as const,
    },
  );

  const listCandidates = tool(
    async (input: any) => {
      assertReadable(role);
      const candidates = await prisma.candidate.findMany({
        where: candidateWhere(input),
        take: Math.min(20, input.limit ?? 10),
        select: {
          name: true,
          email: true,
          stage: true,
          noticeDays: true,
          job: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return candidates.length
        ? JSON.stringify(candidates)
        : "No candidates matched those filters.";
    },
    {
      name: "list_candidates",
      description:
        "List candidates (name, email, stage, notice days, job) filtered by job title, stage, or maximum notice days.",
      schema: {
        type: "object",
        properties: {
          ...candidateFilters,
          limit: { type: "integer", description: "Maximum rows to return, default 10" },
        },
      } as const,
    },
  );

  const jobSummary = tool(
    async (input: any) => {
      assertReadable(role);
      const jobs = await prisma.job.findMany({
        where: { title: { contains: input.jobTitle, mode: "insensitive" } },
        include: { _count: { select: { candidates: true } } },
      });
      if (jobs.length === 0) return `No job found matching "${input.jobTitle}".`;

      const results = await Promise.all(
        jobs.map(async (job) => {
          const grouped = await prisma.candidate.groupBy({
            by: ["stage"],
            where: { jobId: job.id },
            _count: { _all: true },
          });
          const byStage = Object.fromEntries(
            grouped.map((row) => [row.stage, row._count._all]),
          );
          return {
            title: job.title,
            client: job.clientName,
            location: job.location,
            openings: job.openings,
            status: job.status,
            totalCandidates: job._count.candidates,
            byStage,
          };
        }),
      );
      return JSON.stringify(results);
    },
    {
      name: "job_summary",
      description:
        "Summarize a job: client, location, openings, status, total candidates and counts per stage.",
      schema: {
        type: "object",
        properties: { jobTitle: { type: "string", description: "Job title to summarize" } },
        required: ["jobTitle"],
      } as const,
    },
  );

  return [countCandidates, listCandidates, jobSummary];
}
