import { api } from '@/lib/api'
import { API_ROUTES } from '@/lib/api.constants'
import type { Comment } from '@/types'

// Admin, or the issue's assignee (the server returns 404 for anyone else).
export const commentsService = {
  async list(issueId: number): Promise<Array<Comment>> {
    const { data } = await api.get<{ comments: Array<Comment> }>(
      API_ROUTES.issues.comments(issueId),
    )
    return data.comments
  },

  async create(issueId: number, body: string): Promise<Comment> {
    const { data } = await api.post<{ comment: Comment }>(
      API_ROUTES.issues.comments(issueId),
      { body },
    )
    return data.comment
  },
}
