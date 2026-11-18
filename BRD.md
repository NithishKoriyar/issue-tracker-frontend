# Business Requirements Document: Issue Tracker

## 1. Purpose

Teams need one place to record problems, decide who owns each one, follow its progress and discuss it. This system provides that: an administrator manages issues and assigns them, and team members work on what is assigned to them.

## 2. Scope

**In scope**

- User registration and login; a separate administrator account.
- Create, edit, delete and assign issues (administrator).
- Status tracking: Open, In Progress, Closed.
- Comments on issues.
- A dashboard with counts.
- A deployed, publicly reachable web application.

**Out of scope** (possible future work, section 9)

- Email notifications, file attachments, priorities and due dates, audit history, password reset, multiple administrators created from the UI.

## 3. Users and roles

| Role  | Description                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| Admin | One seeded account. Manages all issues and sees every user.                                                          |
| User  | Registers themselves. Sees and works on issues assigned to them. Registration always creates a user, never an admin. |

## 4. Business requirements

| ID   | Requirement                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| BR-1 | A person can create an account and log in; the administrator logs in with a dedicated entry.                             |
| BR-2 | The administrator can create, edit and delete issues.                                                                    |
| BR-3 | The administrator can assign an issue to a user, or leave it unassigned.                                                 |
| BR-4 | Every issue has a status of Open, In Progress or Closed, and the people working on it can change it.                     |
| BR-5 | The administrator and the assignee can comment on an issue.                                                              |
| BR-6 | Everyone sees a dashboard of counts: the administrator for all issues (with a per-user breakdown), a user for their own. |
| BR-7 | A user can only see issues assigned to them.                                                                             |

## 5. Functional requirements

**Authentication**

- FR-1 Register with name, email and password (min 8 characters). Email is unique and case-insensitive.
- FR-2 Log in with email and password. `asAdmin` login refuses non-admin accounts without creating a session.
- FR-3 Sessions last as long as the refresh token (7 days) is valid; logging out ends the session immediately.

**Issues**

- FR-4 Admin creates an issue (title up to 200 characters, description up to 5000, optional status and assignee).
- FR-5 Admin edits any field and deletes an issue (its comments are deleted with it).
- FR-6 The issue list is paginated (10 per page by default), and filterable by status and assignee.
- FR-7 An admin or the assignee can change the status; others get "not found".

**Comments**

- FR-8 Admin or assignee can list and add comments (up to 2000 characters), shown with author and time.

**Dashboard and users**

- FR-9 Counts: total, open, in progress, closed and (admin) unassigned. Admin also gets the busiest users and the latest activity.
- FR-10 Admin can list users with search (name or email), page through them, and see each user's issue counts.

## 6. Non-functional requirements

**Security**

- Passwords are hashed with bcrypt and never returned by the API.
- Access tokens are short-lived (15 minutes) and held only in browser memory. The refresh token is an httpOnly, Secure, `SameSite=Strict` cookie; only its hash is stored; it is rotated on every use, and reuse of an old one revokes the user's sessions.
- Every permission is checked on the server for every request; hiding buttons in the UI is only a convenience.
- All SQL is parameterized; every request is validated with zod; responses are sent with security headers (helmet, and nginx on the frontend).
- Login and registration are rate limited (10 attempts per 15 minutes per IP and email).
- The backend has no public address; only the frontend's proxy can reach it.

**Usability and quality**

- Responsive layout (phone to desktop), loading and error states, and empty states on every list.
- API errors use one shape, `{ "error": { "code", "message" } }`, and the UI shows the message.
- TypeScript (strict) on the frontend; ESLint and Prettier on both sides.

**Performance**

- Lists are paginated on the server and cached on the client (TanStack Query), so pages open instantly on repeat visits.

## 7. Assumptions and constraints

- One administrator account, created from environment variables by the seed script.
- A user sees only issues assigned to them, which is why a new user starts with an empty list until the administrator assigns something.
- The app runs on a single backend instance; the login rate limiter keeps its counters in memory.

## 8. Deployment

### 8.1 Where it is hosted

**Railway** (https://railway.com), in one project with three services:

| Service                  | What it runs                                                      | Public?                                                |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------ |
| `Postgres`               | Railway PostgreSQL with a volume                                  | No (private network only)                              |
| `issue-tracker-backend`  | Express API, built from the backend repo                          | No (private network only)                              |
| `issue-tracker-frontend` | nginx: serves the React build and proxies `/api/*` to the backend | **Yes**: https://issue-tracker-frontend.up.railway.app |

GitHub Pages and Vercel's static hosting cannot run a Node server or a database, so Railway is used for the whole system.

### 8.2 Deployment approach

- Both repositories are connected to Railway from GitHub. **A push to `main` builds and deploys automatically.**
- **Backend:** built by Railpack (detects Node, runs `npm install`, starts with `npm start`). Before each deploy a **Pre-deploy Command** runs `npm run db:migrate && npm run db:seed`, which creates or updates the tables and seeds the admin and demo data. Both are idempotent, so running them on every deploy is safe.
- **Frontend:** built from its `Dockerfile` in two stages: Node builds the app, nginx serves it. At container start the image fills `BACKEND_URL` into `nginx.conf`.
- **One origin:** the browser only calls the frontend's own `/api`, and nginx forwards it to the backend over Railway's private network. That avoids CORS and keeps the refresh cookie first-party.

### 8.3 Required services and variables

**PostgreSQL:** add the Railway _PostgreSQL_ service to the project. No variables to set.

**Backend service** (Variables tab):

| Variable                                      | Value                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                | `${{Postgres.DATABASE_URL}}` (a reference to the database service)                                          |
| `JWT_ACCESS_SECRET`                           | a long random string (generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `ACCESS_TOKEN_TTL`                            | `15m`                                                                                                       |
| `REFRESH_TOKEN_TTL_DAYS`                      | `7`                                                                                                         |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the seeded administrator                                                                                    |
| `NODE_ENV`                                    | `production` (turns on the `Secure` flag for the refresh cookie)                                            |
| `PORT`                                        | `5000` (must match the port in the frontend's `BACKEND_URL`)                                                |

**Frontend service** (Variables tab):

| Variable      | Value                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `BACKEND_URL` | `http://<backend-service-name>.railway.internal:5000`: the backend's **private** address, with `http://`, the port, and no path |

### 8.4 Steps to deploy from scratch

1. **Create the project** on Railway and add a **PostgreSQL** service.
2. **Backend:** _New → GitHub Repo_ → `issue-tracker-backend`.
   - Set the variables in 8.3.
   - _Settings → Deploy → Pre-deploy Command_: `npm run db:migrate && npm run db:seed`.
   - Leave the start command as `npm start`. Do not generate a public domain.
3. **Frontend:** _New → GitHub Repo_ → `issue-tracker-frontend`. Railway detects the `Dockerfile`.
   - Set `BACKEND_URL` as in 8.3.
   - _Settings → Networking → Generate Domain_, with target port **80**. This is the public URL.
4. **Verify:** open the public URL and log in with the demo admin. The checks are in 8.6.

### 8.5 Updating and rolling back

- **Update:** commit and push to `main` in the repository that changed. Railway rebuilds and redeploys it; the backend's pre-deploy command re-applies the schema (safe to repeat).
- **Changing configuration:** edit the variable in the service's Variables tab; Railway redeploys the service.
- **Roll back:** in the service's _Deployments_ tab, open an earlier successful deployment and choose _Redeploy_.
- **Database changes** live in `src/db/schema.sql` as `CREATE … IF NOT EXISTS` statements, applied by `npm run db:migrate`.

### 8.6 Verifying a deployment

1. `https://<frontend-domain>/` loads the login page.
2. Log in as the admin; the dashboard shows counts.
3. Browser dev tools → Network: calls go to `/api/...` on the same domain; the refresh cookie is `HttpOnly` and `Secure`.
4. Log out, then confirm a page reload sends you to the login page.

### 8.7 Troubleshooting

| Symptom                                            | Cause and fix                                                                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `502 BACKEND_UNAVAILABLE` from `/api/*`            | nginx cannot reach the backend. Check the backend's `PORT` matches the port in `BACKEND_URL`, and that the service name in the host is right. nginx's log line names the exact error. |
| `508 PROXY_LOOP`                                   | `BACKEND_URL` points at the frontend. Use the backend's private `.railway.internal` address.                                                                                          |
| Frontend crashes at start with `unknown directive` | A `BACKEND_URL` value with extra line breaks; retype it on one line.                                                                                                                  |
| Login returns 401 for the admin                    | The seed did not run. Check the Pre-deploy Command and the `ADMIN_*` variables.                                                                                                       |
| Login works but the session is lost on reload      | `NODE_ENV` is not `production`, or the site is not served over HTTPS.                                                                                                                 |

## 9. Future enhancements

Email notifications, priorities and due dates, attachments, activity history, password reset, and creating further administrators from the UI.
