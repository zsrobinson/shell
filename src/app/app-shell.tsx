import type { ReactNode } from "react"
import { ChevronDownIcon, EllipsisIcon } from "lucide-react"
import { AppNavigation, type NavGroup, type NavItem } from "./navigation"
import { CommandPalette, type CommandSearch } from "./command-palette"
import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "../components/ui/sidebar"
import { Toaster } from "../components/ui/sonner"
import { TooltipProvider } from "../components/ui/tooltip"
import { AppSwitcher } from "./app-switcher"
import type { AppLink } from "./types"
import { UserMenu } from "./user-menu"
export type EntityBar = { entity: NavItem; page: string; status?: ReactNode }
export type AppShellProps = {
  name: string
  icon?: ReactNode
  apps?: AppLink[]
  email?: string
  logoutUrl?: string
  nav?: ReactNode
  navGroups?: NavGroup[]
  breadcrumbs?: ReactNode
  entityBar?: EntityBar
  /** Names what the command palette finds, for example servers and pages. */
  searchPlaceholder?: string
  /** Query-dependent command palette results, alongside `navGroups`. */
  search?: CommandSearch
  children: ReactNode
}
export function AppShell({
  name,
  icon,
  apps,
  email,
  logoutUrl = "/cdn-cgi/access/logout",
  nav,
  navGroups,
  breadcrumbs,
  entityBar,
  searchPlaceholder,
  search,
  children,
}: AppShellProps) {
  const entity = entityBar?.entity
  const actions = entity?.actions ?? []
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-12 justify-center p-1">
            <AppSwitcher name={name} icon={icon} apps={apps} />
          </SidebarHeader>
          <SidebarContent>
            {navGroups ? <AppNavigation groups={navGroups} /> : nav}
          </SidebarContent>
          <SidebarFooter>
            <UserMenu email={email} logoutUrl={logoutUrl} />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-2" />
            {entity && entityBar ? (
              <>
                <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
                  <span className="truncate text-sm font-medium">
                    {entity.label}
                  </span>
                  {entityBar.status}
                  <span className="text-muted-foreground">/</span>
                  <span className="truncate text-sm">{entityBar.page}</span>
                </div>
                <div className="min-w-0 flex-1 md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="max-w-full"
                        />
                      }
                    >
                      <span className="truncate">
                        {entity.label} / {entityBar.page}
                      </span>
                      <ChevronDownIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {entity.children?.map((link) => (
                        <DropdownMenuItem key={link.id} render={link.render}>
                          {link.icon}
                          {link.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="min-w-0 flex-1 text-sm">{breadcrumbs}</div>
            )}
            {actions
              .filter((a) => a.presentation !== "menu")
              .map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  className="max-md:hidden"
                  variant={
                    action.presentation === "primary" ? "default" : "outline"
                  }
                  disabled={action.disabled}
                  onClick={action.onSelect}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            {actions.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Entity actions"
                    />
                  }
                >
                  <EllipsisIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={action.disabled}
                      onClick={action.onSelect}
                      variant={action.destructive ? "destructive" : "default"}
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {navGroups ? (
              <CommandPalette
                groups={navGroups}
                placeholder={searchPlaceholder}
                search={search}
              />
            ) : null}
          </header>
          <ContentAnchor>{children}</ContentAnchor>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  )
}

function ContentAnchor({ children }: { children: ReactNode }) {
  const { state, isMobile } = useSidebar()
  return (
    <div
      className="flex min-h-0 flex-1 flex-col transition-[padding] duration-200"
      style={{
        paddingInlineStart:
          state === "collapsed" && !isMobile
            ? "calc(var(--sidebar-width) - var(--sidebar-width-icon))"
            : undefined,
      }}
    >
      {children}
    </div>
  )
}
