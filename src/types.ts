// Shared types — they mirror the backend JSON (camelCase).

export type Role = 'admin' | 'user'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
}

// ---- Auth ----

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
  // Admin login: the server refuses non-admin accounts (403 NOT_ADMIN).
  asAdmin?: boolean
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

// ---- Issues ----

export type IssueStatus = 'open' | 'in_progress' | 'closed'

// Small "who" object nested in issues and comments.
export interface UserRef {
  id: number
  name: string
}

export interface Issue {
  id: number
  title: string
  description: string
  status: IssueStatus
  createdAt: string
  updatedAt: string
  assignee: UserRef | null
  createdBy: UserRef
  commentCount: number
}

// GET /issues filters. assignee = user id, or 'unassigned'. (Admin only;
// the server ignores the assignee filter for regular users.)
// These are also the Issues page's URL search params.
export interface IssueFilters {
  status?: IssueStatus
  assignee?: number | 'unassigned'
  page?: number // 1-based; omitted = page 1
}

export interface IssueListParams extends IssueFilters {
  pageSize?: number
}

export interface Pagination {
  page: number
  pageSize: number
  total: number // every issue matching the filters, not just this page
  totalPages: number
}

// GET /issues
export interface IssueListResponse {
  issues: Array<Issue>
  pagination: Pagination
}

// Admin create / edit form.
export interface IssueInput {
  title: string
  description: string
  status: IssueStatus
  assignedTo: number | null
}

// ---- Comments ----

export interface Comment {
  id: number
  body: string
  createdAt: string
  author: UserRef & { role: Role }
}

// ---- Users & dashboard ----

export interface IssueCounts {
  total: number
  open: number
  inProgress: number
  closed: number
}

export interface UserWithCounts extends User {
  issueCounts: IssueCounts
}

// GET /dashboard/stats. `unassigned` and `byUser` are admin-only.
export interface DashboardStats {
  totals: IssueCounts & { unassigned?: number }
  byUser?: UserWithCounts[]
  recentIssues: Issue[]
}

// ---- Errors ----

// Every backend error has this shape: { error: { code, message } }
export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
