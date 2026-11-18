# CLAUDE.md — issue-tracker-frontend

Project-level notes for the Issue Tracker frontend. Stack: React 19, Vite, TypeScript, TanStack Router (file-based), TanStack Query, Tailwind v4, and shadcn/ui on Base UI.

## Layout

```
src/
  main.tsx                QueryClient → QueryClientProvider → AuthProvider → RouterProvider (context: auth)
  router.tsx              getRouter(); also types staticData.title
  routes/                 one file per page (file-based). Never edit routeTree.gen.ts
    __root.tsx            Toaster, NotFound, devtools (dev only)
    (auth)/route.tsx      guest-only group: ONE guard (logged in → redirect into app) + ?redirect= search
    (auth)/login.tsx      /login (+ ?mode=admin = admin login, same page + API); register.tsx → /register
    (core)/route.tsx      logged-in group: requireAuth + SidebarProvider/AppSidebar/SidebarInset + header title
    (core)/index.tsx      /            dashboard (role-aware)
    (core)/issues/index.tsx      /issues      paginated list (10/page); filters + page in the URL (?status=, ?assignee=, ?page=)
    (core)/issues/$issueId.tsx   /issues/:id  detail, status, comments; admin edit/delete
    (core)/users.tsx      /users       admin only (requireAdmin), read-only; paginated (10/page) + debounced search (?q=, ?page= in the URL)
  lib/api.ts              axios instance, in-memory access token, interceptors (Bearer, 401 → refresh → retry), ApiError
  lib/api.constants.ts    API_ROUTES (every backend path) + QUERY_KEYS (every cache-key prefix)
  lib/auth.context.tsx    AuthProvider + useAuth
  lib/auth.guards.ts      validateRedirectSearch, safeRedirect, redirectIfAuthenticated, requireAuth, requireAdmin
  lib/query.ts            invalidateIssueData(queryClient, id?): issues lists + issue + dashboard + users
  lib/issue-status.ts     ISSUE_STATUSES, STATUS_LABELS, isIssueStatus
  lib/format.ts           initials, formatDate, formatDateTime, timeAgo
  lib/utils.ts            cn (shadcn)
  services/               *.service.ts: one object per resource, axios calls only (used as queryFn / mutationFn)
  components/ui/          shadcn components: shared, reusable UI only
  components/auth/        AuthLayout, LoginForm
  components/layout/      AppSidebar, QueryState (ErrorState, EmptyState)
  components/issues/      StatusBadge, StatusSelect, IssueFormDialog, DeleteIssueButton
  components/comments/    CommentSection
  components/dashboard/   StatCard
  components/users/       UserPicker (searchable user popover: 5 up front, debounced search, fixed options)
  hooks/use-debounced-value.ts   useDebouncedValue(value, delay): value after typing pauses
  hooks/use-mobile.ts     shadcn (sidebar)
  types.ts                shared types (mirror the API's camelCase JSON)
```

## Data rules

- Pages call `useQuery` / `useMutation` directly with service methods; keys start with a `QUERY_KEYS` value.
- After any issue change, call `invalidateIssueData(queryClient, id)`. Lists, the dashboard and Users counts all depend on issues.
- `GET /issues` returns `{ issues, pagination }` and `GET /users` returns `{ users, pagination }` (not bare arrays). Cached list data under `[QUERY_KEYS.issues, …]` has that shape too, so keep it when editing the cache with `setQueriesData` (see DeleteIssueButton).
- Hiding admin buttons is UX only. The API enforces every permission (403 for admin-only actions, 404 for someone else's issue).

## Gotchas

- shadcn here is **Base UI**: compose with the `render` prop, not `asChild` (e.g. `<SidebarMenuButton render={<Link to="/issues" />}>`).
- **Base UI Select** shows the raw value in `<SelectValue />` unless the root gets `items` (a `{ value: label }` map). Always pass `items`.
- When a Base UI trigger renders another shadcn component, the trigger's `data-slot` wins. Don't select by the inner component's slot. The mobile sidebar sheet is `[data-mobile="true"]`.
- `SidebarInset` is already the page's `<main>`, so don't nest another `<main>` in the layout.
- Vertical `Separator` uses `data-vertical:self-stretch`. For a short centered divider use `data-vertical:h-4 data-vertical:self-center`.
- `npx shadcn add …` asks before overwriting existing files even with `-y`. Use `yes n | npx shadcn@latest add <names>`, then `npx eslint --fix src/components/ui` (generated files use inline `type` imports).
- Form submit handlers take `SubmitEvent<HTMLFormElement>`; `FormEvent` is deprecated in React 19 types.
- Prettier globs choke on `(auth)` / `(core)` folders, so pass explicit file paths, or run `npm run format`.
- **nginx (prod)** lives in the root `nginx.conf` (`listen 80`). The Dockerfile copies it to `/etc/nginx/templates/`, so envsubst fills `${BACKEND_URL}` and `${NGINX_LOCAL_RESOLVERS}` at startup.
  - Keep `resolver` + `set $backend` + `proxy_pass $backend`, otherwise nginx caches the backend IP and breaks on a backend redeploy.
  - Never add an `add_header` inside a `location`: it drops the server-level security headers there. Use `expires` for caching.
