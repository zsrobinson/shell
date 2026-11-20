export { AppShell, type AppShellProps } from "./app/app-shell"
export { AppIcon } from "./app/app-icon"
export {
  Page,
  PageActions,
  PageHeader,
  PageMeta,
  PageTitle,
  PageGrid,
  PageStack,
  SectionGroup,
} from "./app/page"
export { HUES, isHue, type AppLink, type Hue } from "./app/types"
export { warmUrl } from "./app/warm"
export {
  setThemePreference,
  useResolvedTheme,
  useThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme"
// Re-exported so apps share the toast store used by the shell's Toaster.
export { toast } from "sonner"

export {
  AppNavigation,
  type NavGroup,
  type NavItem,
  type NavLink,
} from "./app/navigation"
