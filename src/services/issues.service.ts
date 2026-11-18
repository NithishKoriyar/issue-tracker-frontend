import { api } from '@/lib/api'
import { API_ROUTES } from '@/lib/api.constants'
import type {
  Issue,
  IssueInput,
  IssueListParams,
  IssueListResponse,
  IssueStatus,
} from '@/types'

// Issue HTTP calls only — caching lives in the pages (TanStack Query).
export const issuesService = {
  // One page of issues + { page, pageSize, total, totalPages }.
  async list(params: IssueListParams = {}): Promise<IssueListResponse> {
    const { data } = await api.get<IssueListResponse>(API_ROUTES.issues.list, {
      params,
    })
    return data
  },

  async get(id: number): Promise<Issue> {
    const { data } = await api.get<{ issue: Issue }>(API_ROUTES.issues.byId(id))
    return data.issue
  },

  // Admin only
  async create(input: IssueInput): Promise<Issue> {
    const { data } = await api.post<{ issue: Issue }>(
      API_ROUTES.issues.list,
      input,
    )
    return data.issue
  },

  // Admin only — send just the fields that change.
  async update(id: number, changes: Partial<IssueInput>): Promise<Issue> {
    const { data } = await api.patch<{ issue: Issue }>(
      API_ROUTES.issues.byId(id),
      changes,
    )
    return data.issue
  },

  // Admin, or the issue's assignee
  async updateStatus(id: number, status: IssueStatus): Promise<Issue> {
    const { data } = await api.patch<{ issue: Issue }>(
      API_ROUTES.issues.status(id),
      { status },
    )
    return data.issue
  },

  // Admin only
  async remove(id: number): Promise<void> {
    await api.delete(API_ROUTES.issues.byId(id))
  },
}
