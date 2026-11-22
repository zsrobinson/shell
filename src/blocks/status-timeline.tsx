import type { ReactNode } from "react"
import { cn } from "../lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip"

export type StatusState = "ok" | "degraded" | "down" | "unknown"

export type StatusPoint = {
  /** Bucket start, epoch milliseconds. */
  time: number
  state: StatusState
  /** Extra tooltip lines, such as "2 failed of 60 checks". */
  detail?: ReactNode
}

const FILL: Record<StatusState, string> = {
  ok: "bg-primary",
  degraded: "bg-chart-3",
  down: "bg-destructive",
  unknown: "bg-muted-foreground/20",
}

export const STATUS_LABELS: Record<StatusState, string> = {
  ok: "Operational",
  degraded: "Degraded",
  down: "Down",
  unknown: "No data",
}

/**
 * Status-page bars, oldest first: one per period, coloured by its worst
 * state. The summary is the accessible name; each bar has a tooltip.
 */
export function StatusTimeline({
  points,
  label,
  formatTime,
  className,
}: {
  points: StatusPoint[]
  /** What the bars describe, such as "Bridge login, last 24 hours". */
  label: string
  formatTime: (time: number) => string
  className?: string
}) {
  const counts = points.reduce<Record<StatusState, number>>(
    (sum, p) => ({ ...sum, [p.state]: sum[p.state] + 1 }),
    { ok: 0, degraded: 0, down: 0, unknown: 0 }
  )
  const summary = `${label}: ${(Object.keys(counts) as StatusState[])
    .filter((s) => counts[s])
    .map((s) => `${counts[s]} ${STATUS_LABELS[s].toLowerCase()}`)
    .join(", ")}`
  return (
    <div
      role="img"
      aria-label={summary}
      className={cn(
        "flex h-8 w-full items-stretch gap-px sm:gap-0.5",
        className
      )}
    >
      {points.map((point) => (
        <Tooltip key={point.time}>
          <TooltipTrigger
            render={
              <div
                aria-hidden
                data-state={point.state}
                className={cn(
                  "min-w-0 flex-1 rounded-[3px] transition-opacity hover:opacity-70",
                  FILL[point.state]
                )}
              />
            }
          />
          <TooltipContent className="flex-col items-start gap-0.5">
            <span className="font-medium">{formatTime(point.time)}</span>
            <span>{STATUS_LABELS[point.state]}</span>
            {point.detail ? (
              <span className="opacity-80">{point.detail}</span>
            ) : null}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

/** The colour key for StatusTimeline. */
export function StatusLegend({
  states = ["ok", "degraded", "down", "unknown"],
  className,
}: {
  states?: StatusState[]
  className?: string
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground",
        className
      )}
    >
      {states.map((state) => (
        <li key={state} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("size-2.5 rounded-[3px]", FILL[state])}
          />
          {STATUS_LABELS[state]}
        </li>
      ))}
    </ul>
  )
}
