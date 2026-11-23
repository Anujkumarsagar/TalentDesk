# TalentDesk Backend

Express + TypeScript + PostgreSQL (Prisma) API for the recruitment tracker, with a BullMQ document-ingestion worker and a Gemini-powered assistant.

## Stack choices

- **Express 5 + TypeScript** — small, explicit HTTP layer that is easy to walk through in the live review.
- **PostgreSQL + Prisma** — relational data fits Jobs/Candidates/StageEvents; Prisma migrations keep the schema reproducible. `pgvector` stores document embeddings.
- **BullMQ + Redis** — PDF/text ingestion runs outside the request thread.
- **LangChain + Gemini** — `bindTools` for live app-data questions, pgvector similarity search for uploaded documents.

## Setup

### 1. Install and configure

```bash
npm install --legacy-peer-deps
cp .env.example .env
```

Fill in `DATABASE_URL`, `JWT_SECRET` and `GOOGLE_API_KEY` (Gemini free tier is fine).

### 2. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

The Postgres image already includes the `vector` extension.

### 3. Migrate, seed and run

```bash
npm run prisma:generate
npm run db:migrate          # creates prisma/migrations and applies them
npm run db:seed             # 3 jobs, 15 candidates, 2 users
npm run dev                 # API on http://localhost:4000
npm run worker              # in a second terminal, ingestion worker
```

Embeddings use `gemini-embedding-001` at 768 dimensions (the retired `text-embedding-004`
is no longer available). `EMBEDDING_DIMENSIONS` must match the `vector(768)` column.
If you already have uploaded documents, run `npm run reindex:embeddings` after changing
the model or dimensions, because embeddings from different models are not comparable.

Seeded logins (password `password123`):

- `recruiter@talentdesk.com` — create/edit
- `viewer@talentdesk.com` — read-only

### 4. Docker (API + worker + database + queue)

```bash
cp .env.example .env        # set GOOGLE_API_KEY and JWT_SECRET
docker compose up --build
docker compose exec backend npm run db:seed
```

## API

All `/api` routes except `/api/auth/login` require `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | JWT token |
| GET | `/api/auth/me` | both | current user |
| GET/POST | `/api/jobs` | both / recruiter | list (`status`, `search`, `page`, `limit`) / create |
| GET/PATCH/DELETE | `/api/jobs/:id` | both / recruiter / recruiter | detail with stage counts / update / delete |
| GET | `/api/jobs/:id/candidates` | both | candidates for a job, filterable |
| GET/POST | `/api/candidates` | both / recruiter | list (`jobId`, `job`, `stage`, `search`, `page`, `limit`) / create |
| GET/PATCH/DELETE | `/api/candidates/:id` | both / recruiter / recruiter | detail with history / update / delete |
| POST | `/api/candidates/:id/move-stage` | recruiter | `{ "toStage": "SCREENED" }`, writes one StageEvent |
| POST | `/api/documents` | recruiter | multipart `file` (+ optional `jobId`), queues ingestion |
| GET | `/api/documents` | both | ingestion status |
| POST | `/api/chat` | both | `{ "message": "..." }` → answer + sources |

## Architecture

```text
Client → Express routes → Zod validation → services → Prisma → PostgreSQL
                                      ↘ BullMQ queue → worker → split/embed → pgvector
Chat → intent router → (tools: read-only Prisma queries) or (pgvector retrieve) → Gemini → answer + citations
```

Key decisions:

- `moveStage` uses `prisma.$transaction`, updating the candidate and appending exactly one `StageEvent`; the seed also writes history through the same append-only table.
- Role checks are enforced twice: in the route (`requireRecruiter`) and **inside every chat tool** (`assertReadable`), so viewers can never trigger a write.
- The LLM never sees SQL. It can only call three fixed tools: `count_candidates`, `list_candidates`, `job_summary`.
- Document answers are grounded in retrieved chunks with `filename (page N, chunk N)` citations; if no chunk clears the similarity threshold, the bot says it does not know.
- A transparent keyword router decides "app data" vs "documents" instead of relying on the model to choose, which keeps the required example questions deterministic.

## Tests

```bash
npm test          # move-stage transaction, role checks, API smoke tests
npm run typecheck
npm run build
```

## What is not here yet

The React frontend, root-level README, `eval.md`, and the 3–5 minute demo video belong to the remaining submission pieces.
