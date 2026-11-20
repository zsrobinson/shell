import type { ReactNode } from "react"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../components/ui/item"

export function ListRow({
  name,
  detail,
  children,
}: {
  name: string
  detail?: ReactNode
  children?: ReactNode
}) {
  return (
    <Item size="xs" variant="muted" role="listitem">
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
        {detail ? (
          <ItemDescription className="line-clamp-1 text-xs">
            {detail}
          </ItemDescription>
        ) : null}
      </ItemContent>
      {children ? <ItemActions>{children}</ItemActions> : null}
    </Item>
  )
}

export function EmptyList({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>
}
