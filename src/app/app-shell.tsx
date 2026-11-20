import { AppNavigation, type NavGroup } from "./navigation"
import type { ReactNode } from "react"

import { Separator } from "../components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "../components/ui/sidebar"
import { Toaster } from "../components/ui/sonner"
import { TooltipProvider } from "../components/ui/tooltip"
import { AppSwitcher } from "./app-switcher"
import type { AppLink } from "./types"
import { UserMenu } from "./user-menu"

export type AppShellProps = {
  /** The current app's display name. */
  name: string
  /** Optional icon for the current app; defaults to its manifest icon. */
  icon?: ReactNode
  /** The runtime manifest of apps. Undefined while it loads. */
  apps?: AppLink[]
  /** The signed-in email. Undefined while the session loads. */
  email?: string
  logoutUrl?: string
  /** The app's own navigation: SidebarGroup elements. */
  nav?: ReactNode
  navGroups?: NavGroup[]
  /** Shown in the top bar, usually a Breadcrumb. */
  breadcrumbs?: ReactNode
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
  children,
}: AppShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
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
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1.5" />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-4 data-vertical:self-center"
            />
            <div className="min-w-0 flex-1">{breadcrumbs}</div>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  )
}
