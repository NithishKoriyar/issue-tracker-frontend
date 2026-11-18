import { useEffect } from 'react'
import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { requireAuth } from '@/lib/auth.guards'

// Layout + guard for every logged-in page in the (core) group.
// Not logged in → /login?redirect=<where they were going>.
export const Route = createFileRoute('/(core)')({
  beforeLoad: ({ context, location }) =>
    requireAuth(context.auth, location.href),
  component: CoreLayout,
})

// The sidebar remembers expanded / collapsed in a cookie (set by shadcn's
// SidebarProvider) — read it so a reload keeps the user's choice.
function sidebarStartsOpen(): boolean {
  const match = /(?:^|;\s*)sidebar_state=(true|false)/.exec(document.cookie)
  return match ? match[1] === 'true' : true
}

function CoreLayout() {
  // Title of the deepest page that declares one (staticData.title).
  const title =
    useMatches()
      .map((match) => match.staticData.title)
      .filter(Boolean)
      .at(-1) ?? 'Issue Tracker'

  useEffect(() => {
    document.title = `${title} · Issue Tracker`
  }, [title])

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={sidebarStartsOpen()}>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-center"
            />
            <h1 className="truncate text-sm font-semibold">{title}</h1>
          </header>
          {/* SidebarInset is already the page's <main>, so this is a div. */}
          <div className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
