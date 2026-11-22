import { cloneElement, type ReactElement, type ReactNode } from "react"
import { cn } from "../lib/utils"

export type SectionNavItem = {
  id: string
  label: ReactNode
  /** A router link or anchor; it receives the tab styling and aria-current. */
  render: ReactElement<{
    className?: string
    "aria-current"?: "page"
    children?: ReactNode
  }>
  active?: boolean
}

/**
 * Sub-pages of one page shown as tabs, each a real link with its own URL.
 * Use Tabs for panels that share a URL; use this when each section is a route.
 */
export function SectionNav({
  items,
  label,
  className,
}: {
  items: SectionNavItem[]
  /** Names the navigation landmark, for example "Settings sections". */
  label: string
  className?: string
}) {
  return (
    <nav
      aria-label={label}
      className={cn("-mx-1 overflow-x-auto px-1 pb-1", className)}
    >
      <ul className="inline-flex h-8 w-fit items-center gap-0.5 rounded-2xl bg-muted p-[3px] text-muted-foreground">
        {items.map((item) => (
          <li key={item.id} className="h-full">
            {cloneElement(item.render, {
              "aria-current": item.active ? "page" : undefined,
              className: cn(
                "inline-flex h-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-transparent px-3 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                item.active &&
                  "bg-background text-foreground shadow-xs dark:border-input dark:bg-input/30 dark:text-foreground",
                item.render.props.className
              ),
              children: item.label,
            })}
          </li>
        ))}
      </ul>
    </nav>
  )
}
