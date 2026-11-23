# TalentDesk Frontend

React (JSX) + Vite + Tailwind CSS frontend for the TalentDesk recruitment tracker.

## Run locally

```bash
npm install
cp .env.example .env   # optional: change VITE_API_URL if the API is elsewhere
npm run dev            # http://localhost:5173
```

Build for production with `npm run build` and preview with `npm run preview`.

The API must be running at `VITE_API_URL` (default `http://localhost:4000`). See `../Backend/README.md` for database, migration, seed, and worker setup.

## What's here

- **Login** — JWT-based sign-in with seeded Recruiter / Viewer demo accounts.
- **Jobs** — searchable, filterable, paginated list with candidate counts for all six stages; create/edit/delete jobs (Recruiter only).
- **Job detail** — pipeline snapshot, candidate table with stage/search filters, add/edit/delete candidate, and a "Move stage" action that writes stage history.
- **Candidate detail** — profile details and an append-only stage history timeline.
- **Candidates** — global search/filter across all jobs.
- **AI Assistant** — chat panel for document Q&A and app-data tool calls, with citations, suggested questions, and background document upload/status tracking (Recruiter only).

## Tech notes

- `src/api/client.js` exports an Axios `apiClient` with Bearer-token and error interceptors, plus the small `api` object used by the pages.
- Auth state is in `src/context/AuthContext.jsx`; transient notifications are in `src/context/ToastContext.jsx`.
- `src/components/Motion.jsx` holds reusable animated building blocks (page/stagger transitions, animated counters, tooltips, confetti, skeletons) powered by `motion/react`.
- All API field names are camelCase and enums are uppercase (`OPEN`, `ON_HOLD`, `SCREENED`, etc.), matching the backend.
- Viewers are read-only in the UI; the backend independently enforces the same role checks.
