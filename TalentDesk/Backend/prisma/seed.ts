import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import type { CandidateStage } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const stageOrder: CandidateStage[] = [
  "APPLIED",
  "SCREENED",
  "INTERVIEWED",
  "SELECTED",
  "JOINED",
  "REJECTED",
];

async function main(): Promise<void> {
  // Reset only the CRUD data; users are upserted so logins stay stable.
  await prisma.stageEvent.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@talentdesk.com" },
    update: { role: "RECRUITER", passwordHash },
    create: {
      email: "recruiter@talentdesk.com",
      name: "Riya Recruiter",
      role: "RECRUITER",
      passwordHash,
    },
  });
  const viewer = await prisma.user.upsert({
    where: { email: "viewer@talentdesk.com" },
    update: { role: "VIEWER", passwordHash },
    create: {
      email: "viewer@talentdesk.com",
      name: "Vikram Viewer",
      role: "VIEWER",
      passwordHash,
    },
  });

  const jobs = await Promise.all(
    [
      { title: "Python Developer", clientName: "Acme Corp", location: "Bengaluru", openings: 3 },
      { title: "Frontend Engineer", clientName: "Globex", location: "Remote", openings: 2 },
      { title: "Data Analyst", clientName: "Initech", location: "Pune", openings: 1 },
    ].map((data) => prisma.job.create({ data })),
  );

  const distribution: CandidateStage[] = [
    "APPLIED",
    "APPLIED",
    "APPLIED",
    "SCREENED",
    "SCREENED",
    "SCREENED",
    "INTERVIEWED",
    "INTERVIEWED",
    "INTERVIEWED",
    "SELECTED",
    "SELECTED",
    "JOINED",
    "JOINED",
    "REJECTED",
    "REJECTED",
  ];

  for (let index = 0; index < distribution.length; index += 1) {
    const stage = distribution[index]!;
    const job = jobs[index % jobs.length]!;
    const number = String(index + 1).padStart(2, "0");
    const candidate = await prisma.candidate.create({
      data: {
        name: `Candidate ${number}`,
        email: `candidate${number}@example.com`,
        phone: `+91 98${number}00000${index % 10}`,
        currentCtc: 4 + index * 0.5,
        expectedCtc: 6 + index * 0.75,
        noticeDays: [15, 30, 45, 60, 90][index % 5]!,
        jobId: job.id,
        stage,
      },
    });

    const targetIndex = stageOrder.indexOf(stage);
    for (let step = 0; step <= targetIndex; step += 1) {
      if (step === 0) continue;
      await prisma.stageEvent.create({
        data: {
          candidateId: candidate.id,
          fromStage: stageOrder[step - 1]!,
          toStage: stageOrder[step]!,
          changedById: step % 2 === 0 ? recruiter.id : viewer.id,
          createdAt: new Date(Date.now() - (targetIndex - step) * 86_400_000),
        },
      });
    }
  }

  console.log("Seeded 3 jobs, 15 candidates and stage history.");
  console.log("Recruiter: recruiter@talentdesk.com / password123");
  console.log("Viewer:    viewer@talentdesk.com / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
