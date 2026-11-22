import {
  useState,
  cloneElement,
  type ReactElement,
  type ReactNode,
} from "react"
import { EllipsisIcon, PlusIcon } from "lucide-react"
import { Separator } from "../components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "../components/ui/sidebar"
export type NavAction = {
  id: string
  label: string
  icon?: ReactNode
  onSelect: () => void
  disabled?: boolean
  destructive?: boolean
  presentation?: "primary" | "outline" | "menu"
}
export type NavLink = {
  id: string
  label: string
  icon?: ReactNode
  render: ReactElement
  active?: boolean
  badge?: ReactNode
  section?: string
  onSelect?: () => void
  /** Extra words the command palette matches, such as an id. */
  keywords?: string[]
}
export type NavItem = NavLink & {
  children?: NavLink[]
  status?: ReactNode
  statusLabel?: string
  actions?: NavAction[]
}
export type NavGroup = {
  id: string
  label?: string
  render?: ReactElement
  action?: ReactElement
  actionLabel?: string
  hidden?: boolean
  items: NavItem[]
}
export function ActionMenu({
  actions,
  label = "Entity actions",
}: {
  actions: NavAction[]
  label?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<SidebarMenuAction showOnHover aria-label={label} />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={action.disabled}
            variant={action.destructive ? "destructive" : "default"}
            onClick={action.onSelect}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
function Flyout({ item }: { item: NavItem }) {
  const { setOpenMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  isActive={false}
                  onPointerEnter={() => setOpen(true)}
                  aria-label={`${item.label} pages`}
                  className="relative rounded-xl bg-sidebar-accent/50"
                />
              }
            />
          }
        >
          {item.icon ?? <span>{item.label.charAt(0)}</span>}
          <span className="absolute right-0 bottom-0 rounded-full bg-sidebar p-0.5">
            {item.status}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
          {item.statusLabel ? ` · ${item.statusLabel}` : ""}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" align="start" className="min-w-44">
        {item.children?.map((child, i) => (
          <DropdownMenuItem
            key={child.id}
            render={child.render}
            onClick={() => setOpenMobile(false)}
            className={
              i > 0 && child.section !== item.children?.[i - 1].section
                ? "mt-1"
                : ""
            }
          >
            {child.icon}
            {child.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export function AppNavigation({ groups }: { groups: NavGroup[] }) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const rail = state === "collapsed" && !isMobile
  const active = groups
    .flatMap((g) => g.items)
    .find((i) => i.active && i.children?.length)
  return (
    <nav aria-label="Application">
      {groups
        .filter((g) => !g.hidden)
        .map((group) => (
          <SidebarGroup key={group.id}>
            {group.label ? (
              <>
                <SidebarGroupLabel render={group.render}>
                  {group.label}
                </SidebarGroupLabel>
                {group.action ? (
                  <SidebarGroupAction
                    render={group.action}
                    title={group.actionLabel ?? "New item"}
                  >
                    <PlusIcon />
                    <span className="sr-only">
                      {group.actionLabel ?? "New item"}
                    </span>
                  </SidebarGroupAction>
                ) : null}
              </>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    {rail && item.children?.length ? (
                      <Flyout item={item} />
                    ) : (
                      <>
                        <SidebarMenuButton
                          render={item.render}
                          isActive={item.active && !item.children?.length}
                          tooltip={`${item.label}${item.statusLabel ? ` · ${item.statusLabel}` : ""}`}
                          onClick={() => setOpenMobile(false)}
                          className={item.active ? "font-medium" : ""}
                        >
                          {item.status ?? item.icon}
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.badge !== undefined ? (
                          <SidebarMenuBadge
                            className={item.actions?.length ? "right-8" : ""}
                          >
                            {item.badge}
                          </SidebarMenuBadge>
                        ) : null}
                        {item.actions?.length ? (
                          <ActionMenu
                            actions={item.actions}
                            label={`${item.label} actions`}
                          />
                        ) : null}
                        {item.active && item.children?.length && !isMobile ? (
                          <SidebarMenuSub className="mr-0 pr-0">
                            {item.children.map((child, i) => (
                              <SidebarMenuSubItem
                                key={child.id}
                                className={
                                  i > 0 &&
                                  child.section !==
                                    item.children?.[i - 1].section
                                    ? "mt-1"
                                    : ""
                                }
                              >
                                <SidebarMenuSubButton
                                  render={child.render}
                                  isActive={child.active}
                                  onClick={() => setOpenMobile(false)}
                                >
                                  {child.icon}
                                  <span>{child.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        ) : null}
                      </>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      {rail && active ? (
        <SidebarGroup>
          <Separator className="mb-2" />
          <SidebarMenu>
            {active.children?.map((child, i) => (
              <SidebarMenuItem
                key={child.id}
                className={
                  i > 0 && child.section !== active.children?.[i - 1].section
                    ? "mt-1"
                    : ""
                }
              >
                <SidebarMenuButton
                  render={child.render}
                  isActive={child.active}
                  tooltip={child.label}
                  aria-label={child.label}
                >
                  {child.icon}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ) : null}
    </nav>
  )
}
/** Execute a registered destination without teaching shell about the app router. */
export function selectNavLink(link: NavLink) {
  if (link.onSelect) {
    link.onSelect()
    return
  }
  const props = link.render.props as { href?: string }
  if (props.href) location.assign(props.href)
}
export function CommandLink({ link }: { link: NavLink }) {
  return cloneElement(link.render as ReactElement<{ tabIndex?: number }>, {
    tabIndex: -1,
  })
}
