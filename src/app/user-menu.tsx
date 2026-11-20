import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../components/ui/sidebar"
import { Skeleton } from "../components/ui/skeleton"
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from "../theme"

const THEMES: {
  value: ThemePreference
  label: string
  icon: typeof SunIcon
}[] = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
]

export function UserMenu({
  email,
  logoutUrl,
}: {
  /** Undefined while the session loads. */
  email?: string
  logoutUrl: string
}) {
  const theme = useThemePreference()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={email ?? "Account"}
                aria-label={email ?? "Account"}
                className="data-popup-open:bg-sidebar-accent"
              />
            }
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium"
            >
              {email ? email.charAt(0).toUpperCase() : null}
            </span>
            {email ? (
              <span className="flex-1 truncate">{email}</span>
            ) : (
              <Skeleton className="h-4 flex-1" />
            )}
            <ChevronsUpDownIcon className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {email ?? "Signed in"}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) =>
                  setThemePreference(value as ThemePreference)
                }
              >
                {THEMES.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    <Icon />
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<a href={logoutUrl} />}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
