import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  BugIcon,
  ChevronsUpDownIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  LogOutIcon,
  UsersIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth.context'
import { initials } from '@/lib/format'

interface NavItem {
  label: string
  to: '/' | '/issues' | '/users'
  icon: LucideIcon
  adminOnly?: boolean
}

// One list for both roles; adminOnly items are hidden for regular users.
// (Hiding is UX only — /users also has a route guard and the API returns 403.)
const NAV_ITEMS: Array<NavItem> = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboardIcon },
  { label: 'Issues', to: '/issues', icon: ListTodoIcon },
  { label: 'Users', to: '/users', icon: UsersIcon, adminOnly: true },
]

export function AppSidebar() {
  const { user, isAdmin, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()
  const matchRoute = useMatchRoute()

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  // On phones the sidebar is a drawer — close it after picking a page.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    // collapsible="icon": on desktop it shrinks to an icon rail (Ctrl/⌘ + B);
    // on mobile it becomes a slide-out drawer.
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/" onClick={closeOnMobile} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BugIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Issue Tracker</span>
                <span className="truncate text-xs text-muted-foreground">
                  {isAdmin ? 'Admin workspace' : 'My workspace'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    // "/" must match exactly; "/issues" also covers /issues/3.
                    isActive={Boolean(
                      matchRoute({ to: item.to, fuzzy: item.to !== '/' }),
                    )}
                    tooltip={item.label}
                    render={<Link to={item.to} onClick={closeOnMobile} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-popup-open:bg-sidebar-accent"
                  />
                }
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold">
                  {initials(user?.name ?? '?')}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                className="min-w-56"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span className="truncate">{user?.name}</span>
                    <Badge variant={isAdmin ? 'default' : 'secondary'}>
                      {isAdmin ? 'Admin' : 'User'}
                    </Badge>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {/* Logout clears the user; the (core) guard then sends them to /login. */}
                <DropdownMenuItem onClick={() => void logout()}>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Thin edge on desktop you can click to collapse / expand. */}
      <SidebarRail />
    </Sidebar>
  )
}
