import type { QueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/api.constants'

// After any change to an issue (create, edit, status, delete, new comment),
// everything that shows issue data must refetch: the lists, that issue,
// the dashboard counts and the per-user counts on the Users page.
export function invalidateIssueData(
  queryClient: QueryClient,
  issueId?: number,
) {
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.issues] })
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] })
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] })
  if (issueId !== undefined) {
    void queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.issue, issueId],
    })
  }
}
