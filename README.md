# Issue Tracker

A full-stack issue tracker: an admin creates, edits, assigns and deletes issues; users sign up, work on the issues assigned to them, change their status and discuss them in comments. A dashboard shows live counts.

|                 |                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------ |
| **Live app**    | https://issue-tracker-frontend.up.railway.app                                              |
| **Frontend**    | this repository: https://github.com/NithishKoriyar/issue-tracker-frontend                  |
| **Backend API** | https://github.com/NithishKoriyar/issue-tracker-backend (full API reference in its README) |
| **BRD**         | [BRD.md](BRD.md) (requirements, and the **Deployment** section)                            |

## Demo accounts

| Role  | Email              | Password     | Where to log in                                                                 |
| ----- | ------------------ | ------------ | ------------------------------------------------------------------------------- |
| Admin | `admin@gmail.com`  | `admin@123`  | `/login?mode=admin` (the "Admin login" link on the login page)                  |
| User  | `asha@example.com` | `User@12345` | `/login`. 19 more demo users follow the same pattern, or register a new account |

The demo data is 20 users, 20 issues (open, in progress, closed, and a few unassigned) and a handful of comments.

## Features

- **Registration and login** for users. **Admin login** is the same page and API (`?mode=admin`); a non-admin account is refused.
- **Issues:** create, edit, delete and assign (admin). Title, description, status, assignee.
- **Status tracking:** Open, In Progress, Closed. The admin can set any issue; a user can set it on issues assigned to them.
- **Comments** on every issue, by the admin or the assignee.
- **Dashboard** with counts (total, open, in progress, closed, unassigned). The admin sees global counts plus an "Issues by user" breakdown; a user sees their own.
- **Issues list:** server-side pagination, filter by status and assignee (searchable user picker), filters kept in the URL.
- **Users page** (admin): paginated list with debounced server-side search and per-user issue counts.
- Responsive layout with a collapsible sidebar (Dashboard, Issues, Users for the admin).

### Who can do what (enforced by the API, not just hidden in the UI)

| Action                          | Admin             | User                        |
| ------------------------------- | ----------------- | --------------------------- |
| Register                        | seeded only       | public sign-up              |
| View issues                     | all               | only those assigned to them |
| Create / edit / delete / assign | yes               | no                          |
| Change status                   | any issue         | own assigned issues         |
| Comment                         | any issue         | own assigned issues         |
| Dashboard                       | global + per user | own counts                  |
| List users                      | yes               | no                          |

## Architecture

```
 Browser ──HTTPS──▶  Frontend service (nginx)  ──private network──▶  Backend service (Express)  ──▶  PostgreSQL
                      · serves the React build                         · REST API under /api
                      · proxies /api/* to the backend                  · JWT + refresh-token auth
```

- The browser only ever talks to **one origin**. nginx serves the single-page app and forwards every `/api/*` request to the backend over Railway's private network, so there is **no CORS**, and the refresh-token cookie is first-party (`SameSite=Strict`). Locally the Vite dev server does the same job with a proxy.
- The backend has **no public URL**; it is reachable only through the frontend's proxy.

### Authentication

- **Access token:** a short-lived JWT (15 minutes), kept **in memory only** (never in `localStorage`) and sent as `Authorization: Bearer`.
- **Refresh token:** random 64 bytes in an **httpOnly, Secure, `SameSite=Strict`** cookie (7 days, `Path=/api/auth`). Only its SHA-256 hash is stored in the database.
- **Rotation and theft detection:** every refresh issues a new token and revokes the old one; reusing a revoked token revokes all of that user's sessions.
- **Frontend flow:** when the API answers `401 TOKEN_EXPIRED`, one shared refresh call runs, then the failed request is retried once. The session is also restored with one refresh on page load. There are no timers.

## Tech stack

| Layer    | Technology                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React 19, Vite, **TypeScript** (strict), TanStack Router (file-based), TanStack Query, axios, Tailwind CSS v4, shadcn/ui (Base UI), sonner           |
| Backend  | Node 22, Express 5 (JavaScript, ES modules), PostgreSQL via `pg` with raw parameterized SQL, zod, bcryptjs, jsonwebtoken, helmet, express-rate-limit |
| Hosting  | Railway: PostgreSQL + backend + frontend (nginx)                                                                                                     |

## Project structure

```
src/
  main.tsx            QueryClient → AuthProvider → RouterProvider
  routes/             file-based routes: (auth) = login/register, (core) = dashboard, issues, users
  lib/                api.ts (axios + token refresh), api.constants.ts, auth context and route guards
  services/           one object per resource; axios calls only
  components/         ui/ (shadcn), auth/, layout/, issues/, comments/, dashboard/, users/
  hooks/              use-debounced-value, use-mobile
  types.ts            shared types mirroring the API's JSON
Dockerfile            build with Node, serve with nginx
nginx.conf            static files + /api proxy (template filled with BACKEND_URL at start)
```

## Run it locally

Prerequisites: Node 22+, PostgreSQL 16+.

**1. Backend** (see the [backend README](https://github.com/NithishKoriyar/issue-tracker-backend#readme) for details)

```bash
git clone https://github.com/NithishKoriyar/issue-tracker-backend.git
cd issue-tracker-backend
npm install
cp .env.example .env          # then edit DATABASE_URL and JWT_ACCESS_SECRET
createdb issue_tracker        # or create the database any other way
npm run db:migrate && npm run db:seed
npm run dev                   # http://localhost:5000
```

**2. Frontend**

```bash
git clone https://github.com/NithishKoriyar/issue-tracker-frontend.git
cd issue-tracker-frontend
npm install
cp .env.example .env          # BACKEND_URL=http://localhost:5000 (the default)
npm run dev                   # http://localhost:3000
```

Open http://localhost:3000 and log in with a demo account above.

### Scripts

| Command          | What it does                                       |
| ---------------- | -------------------------------------------------- |
| `npm run dev`    | dev server on :3000, proxies `/api` to the backend |
| `npm run build`  | type-check and production build into `dist/`       |
| `npm run lint`   | ESLint                                             |
| `npm run format` | Prettier                                           |

## Environment variables

| Variable      | Where                                                     | Meaning                                                                                                                                                                                                                                                         |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BACKEND_URL` | frontend (`.env` locally, Railway variable in production) | Where the backend API runs. The app itself always calls a relative `/api`; this tells the server in front of it where to forward. Local: `http://localhost:5000`. Railway: the backend's **private** address, `http://<backend-service>.railway.internal:5000`. |

It has no `VITE_` prefix on purpose: the browser never reads it. The backend's variables are listed in its README.

## API

The API is documented in the [backend README](https://github.com/NithishKoriyar/issue-tracker-backend#api-reference). In short: `/api/auth/*` (register, login, refresh, logout, me), `/api/issues` (+ status and comments), `/api/users` (admin), `/api/dashboard/stats`.

## Deployment (summary)

Hosted on **Railway** as three services: PostgreSQL, the backend (built by Railpack), and this frontend (built from the `Dockerfile`). Pushing to `main` redeploys automatically. The full steps, variables, update and rollback procedure are in the **Deployment section of [BRD.md](BRD.md)**.

**Why Railway:** GitHub Pages and Vercel's static hosting cannot run an Express server or PostgreSQL. Railway runs all three parts of the system on one private network, which also lets the browser use one origin with a first-party secure cookie.
