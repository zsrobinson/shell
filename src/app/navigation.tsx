import type { ReactElement, ReactNode } from "react"
import { Collapsible } from "@base-ui/react/collapsible"
import { ChevronRightIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
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

export type NavLink = {
  id: string
  label: string
  icon?: ReactNode
  /** A router link or anchor. Shell owns presentation, the app owns routing. */
  render: ReactElement
  active?: boolean
  badge?: ReactNode
}
export type NavItem = NavLink & { children?: NavLink[] }
export type NavGroup = { id: string; label?: string; items: NavItem[] }

export function AppNavigation({ groups }: { groups: NavGroup[] }) {
  return groups.map((group) => (
    <SidebarGroup key={group.id}>
      {group.label ? (
        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <NavigationItem
              key={`${item.id}:${Boolean(item.active)}`}
              item={item}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}
function NavigationItem({ item }: { item: NavItem }) {
  const { state, isMobile, setOpen, setOpenMobile } = useSidebar()
  const close = () => setOpenMobile(false)
  const button = (
    <SidebarMenuButton
      render={item.render}
      isActive={item.active}
      tooltip={item.label}
      onClick={() => {
        close()
        if (!isMobile && state === "collapsed" && item.children?.length)
          setOpen(true)
      }}
    >
      {item.icon}
      <span>{item.label}</span>
    </SidebarMenuButton>
  )
  if (!item.children?.length)
    return (
      <SidebarMenuItem>
        {button}
        {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
      </SidebarMenuItem>
    )
  return (
    <Collapsible.Root
      defaultOpen={item.active}
      render={<SidebarMenuItem />}
      className="group/navigation"
    >
      {button}
      <Collapsible.Trigger
        render={<SidebarMenuAction />}
        aria-label={`Toggle ${item.label} pages`}
      >
        <ChevronRightIcon className="transition-transform group-data-open/navigation:rotate-90" />
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <SidebarMenuSub>
          {item.children.map((child) => (
            <SidebarMenuSubItem key={child.id}>
              <SidebarMenuSubButton
                render={child.render}
                isActive={child.active}
                onClick={close}
              >
                {child.icon}
                <span>{child.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
