import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { cn } from "../lib/utils"

export type StackedColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Cell classes in the table layout, for example "text-right". */
  className?: string
  /** Header text is visually hidden (for action columns). */
  hideHeader?: boolean
  /**
   * Narrow screens: `title` and `end` share the first line, `detail` cells
   * follow as a muted line, `hidden` cells are left out.
   */
  stack?: "title" | "end" | "detail" | "hidden"
}

/**
 * A table on wide screens that becomes one list row per record on narrow
 * ones, so nothing scrolls sideways at phone width.
 */
export function StackedTable<T>({
  rows,
  columns,
  rowKey,
  label,
  className,
  rowClassName,
}: {
  rows: T[]
  columns: StackedColumn<T>[]
  rowKey: (row: T) => string
  /** Accessible name for the table and the list. */
  label: string
  className?: string
  rowClassName?: (row: T) => string | undefined
}) {
  const title = columns.filter((c) => (c.stack ?? "detail") === "title")
  const end = columns.filter((c) => c.stack === "end")
  const detail = columns.filter((c) => (c.stack ?? "detail") === "detail")
  return (
    <div className={cn("min-w-0", className)}>
      <Table aria-label={label} className="max-sm:hidden">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column, index) => (
              <TableHead
                key={column.id}
                className={cn(
                  index === 0 && "pl-4",
                  index === columns.length - 1 && "pr-4",
                  column.className
                )}
              >
                {column.hideHeader ? (
                  <span className="sr-only">{column.header}</span>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} className={rowClassName?.(row)}>
              {columns.map((column, index) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    index === 0 && "pl-4",
                    index === columns.length - 1 && "pr-4",
                    column.className
                  )}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ul aria-label={label} className="divide-y sm:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn("flex flex-col gap-1 px-4 py-3", rowClassName?.(row))}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                {title.map((column) => (
                  <span key={column.id} className="min-w-0">
                    {column.cell(row)}
                  </span>
                ))}
              </div>
              {end.length ? (
                <div className="flex shrink-0 items-center gap-1">
                  {end.map((column) => (
                    <span key={column.id}>{column.cell(row)}</span>
                  ))}
                </div>
              ) : null}
            </div>
            {detail.length ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {detail.map((column) => (
                  <span key={column.id} className="min-w-0 break-words">
                    {column.cell(row)}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
