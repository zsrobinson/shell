import type { ReactNode } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "../components/ui/sidebar"
import { AppIcon } from "./app-icon"
import type { AppLink } from "./types"
import { isCurrentApp, warmUrl } from "./warm"

export function AppSwitcher({
  name,
  icon,
  apps,
}: {
  name: string
  icon?: ReactNode
  /** Undefined while the manifest loads. */
  apps?: AppLink[]
}) {
  const current = apps?.find((app) => isCurrentApp(app.url))

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="default"
                tooltip={name}
                aria-label={name}
                className="h-10 data-popup-open:bg-sidebar-accent"
              />
            }
          >
            <AppIcon
              name={name}
              icon={icon ?? current?.icon}
              colour={current?.colour}
              className="size-8 rounded-[calc(var(--radius)*0.5)]"
            />
            <span className="flex-1 truncate font-medium">{name}</span>
            <ChevronsUpDownIcon className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Apps</DropdownMenuLabel>
              {apps === undefined ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : apps.length === 0 ? (
                <DropdownMenuItem disabled>No other apps</DropdownMenuItem>
              ) : (
                apps.map((app) => (
                  <DropdownMenuItem
                    key={app.url}
                    render={<a href={app.url} />}
                    onPointerEnter={() => warmUrl(app.url)}
                    onFocus={() => warmUrl(app.url)}
                  >
                    <AppIcon
                      name={app.name}
                      icon={app.icon}
                      colour={app.colour}
                      className="size-6 rounded-lg text-xs"
                    />
                    <span className="flex-1 truncate">{app.name}</span>
                    {isCurrentApp(app.url) ? (
                      <CheckIcon aria-label="Current app" />
                    ) : null}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
