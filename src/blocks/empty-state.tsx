import type { ReactNode } from "react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../components/ui/empty"
import { cn } from "../lib/utils"

/**
 * Nothing here yet: a title, an optional functional sentence and the action
 * that fills the space. Sized to sit inside a card.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <Empty className={cn("gap-3 p-6 md:p-8", className)}>
      <EmptyHeader>
        {icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
