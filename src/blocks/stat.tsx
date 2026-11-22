import { Children, type ComponentProps, type ReactNode } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "../lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip"

/** A figure with its label above and, when it is data, context below. */
export function Stat({
  label,
  children,
  delta,
  detail,
  className,
}: {
  label: ReactNode
  children: ReactNode
  /** A StatDelta comparing with the previous period. */
  delta?: ReactNode
  detail?: ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="stat"
      className={cn("flex min-w-0 flex-col gap-0.5", className)}
    >
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
          {children}
        </span>
        {delta}
      </dd>
      {detail ? (
        <dd className="text-xs text-muted-foreground">{detail}</dd>
      ) : null}
    </div>
  )
}

/** A row of figures: two or three across on a phone, one line on wider screens. */
export function StatRow({
  className,
  children,
  ...props
}: ComponentProps<"dl">) {
  const count = Children.toArray(children).filter(Boolean).length
  return (
    <dl
      className={cn(
        "grid gap-x-4 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-10",
        count === 3
          ? "grid-cols-3"
          : count === 1
            ? "grid-cols-1"
            : "grid-cols-2",
        className
      )}
      {...props}
    >
      {children}
    </dl>
  )
}

const percent = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
})

/**
 * Change against the previous period of the same length. `better` says which
 * direction is good news, so more errors read as negative and more saved
 * work as positive; "none" keeps the change neutral.
 */
export function StatDelta({
  current,
  previous,
  better = "up",
  format = (value) => value.toLocaleString(),
  period = "previous period",
}: {
  current: number
  previous: number
  better?: "up" | "down" | "none"
  format?: (value: number) => string
  /** Names the comparison in the tooltip and for screen readers. */
  period?: string
}) {
  const change = current - previous
  const tone =
    change === 0 || better === "none"
      ? "text-muted-foreground"
      : change > 0 === (better === "up")
        ? "text-positive"
        : "text-negative"
  const text =
    change === 0
      ? "No change"
      : previous === 0
        ? `+${format(change)}`
        : percent.format(Math.abs(change) / previous)
  const description = `${format(previous)} in the ${period}`
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-sm text-xs font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
              tone
            )}
          />
        }
      >
        {change > 0 && previous !== 0 ? (
          <ArrowUpIcon aria-hidden className="size-3" />
        ) : change < 0 ? (
          <ArrowDownIcon aria-hidden className="size-3" />
        ) : null}
        <span>{text}</span>
        <span className="sr-only">
          {change > 0 ? "up" : change < 0 ? "down" : ""} from {description}
        </span>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  )
}
