import { createFileRoute } from '@tanstack/react-router'
import {
  redirectIfAuthenticated,
  validateRedirectSearch,
} from '@/lib/auth.guards'

// One guard for every guest-only page in the (auth) group: /login (user and
// admin mode) and /register. A logged-in user is sent on into the app
// (?redirect= or /). This also runs right after a successful login — main.tsx
// re-runs guards when the user changes — which is what performs the redirect.
// No component: a layout route without one simply renders its child page.
export const Route = createFileRoute('/(auth)')({
  validateSearch: validateRedirectSearch,
  beforeLoad: ({ context, search }) =>
    redirectIfAuthenticated(context.auth, search.redirect),
})
