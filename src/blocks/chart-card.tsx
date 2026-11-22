import { useLayoutEffect, useState } from "react"
import {
  chartTimestamp,
  chartTooltipTime,
  formatChartTime,
} from "../lib/chart-time"
import {
  everyNth,
  fitTimeTicks,
  formatTimeTick as formatTickTime,
  labelWidth,
  niceTicks,
  timeTicks,
  type NiceScale,
} from "../lib/chart-ticks"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "../components/ui/chart"

export type ChartRange = "1h" | "24h" | "7d" | "30d"
/** `time` is numeric epoch milliseconds. */
export type ChartPoint = { time: number; [key: string]: number | null }
export const chartNumber = (value: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10000 ? "compact" : "standard",
  }).format(value)
export type ChartRangeOption<T extends string = string> = {
  value: T
  label: string
  /** Seconds, or all available history. Calendar ranges can be resolved by the caller. */
  duration: number | "all"
}
export const defaultChartRanges: readonly ChartRangeOption<ChartRange>[] = [
  { value: "1h", label: "Last hour", duration: 3600 },
  { value: "24h", label: "Last 24 hours", duration: 86400 },
  { value: "7d", label: "Last 7 days", duration: 604800 },
  { value: "30d", label: "Last 30 days", duration: 2592000 },
]
export function ChartRangeSelect<T extends string = ChartRange>({
  value,
  onChange,
  ranges = defaultChartRanges as unknown as readonly ChartRangeOption<T>[],
}: {
  value: T
  onChange: (value: T) => void
  ranges?: readonly ChartRangeOption<T>[]
}) {
  return (
    <select
      aria-label="Chart time range"
      className="h-8 rounded-lg border bg-background px-2 text-sm"
      value={value}
      onChange={(e) => {
        const selected = ranges.find((r) => r.value === e.target.value)
        if (selected) onChange(selected.value)
      }}
    >
      {ranges.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  )
}
/** The rendered size of an element, following resizes; pass `ref` to it. */
const coarseQuery = "(hover: none) and (pointer: coarse)"
/**
 * Touch screens have no hover, and Recharts follows only touch moves, so a
 * tap would show nothing. There the tooltip opens on tap (a click) instead.
 */
function useTooltipTrigger(): "hover" | "click" {
  const [coarse] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(coarseQuery).matches
  )
  return coarse ? "click" : "hover"
}

function useElementSize<T extends HTMLElement>() {
  const [element, ref] = useState<T | null>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  )
  useLayoutEffect(() => {
    if (!element) return
    const measure = () => {
      const r = element.getBoundingClientRect()
      setSize((prev) =>
        prev && prev.width === r.width && prev.height === r.height
          ? prev
          : { width: r.width, height: r.height }
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return [ref, size] as const
}

// A halo in the card colour keeps line labels legible over bars and areas.
const LINE_LABEL = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
  stroke: "var(--card)",
  strokeWidth: 3,
  paintOrder: "stroke",
} as const

const Y_AXIS_WIDTH = 72
const MARGIN = { left: 0, right: 12, top: 12, bottom: 0 }
const X_AXIS_HEIGHT = 30
const LEGEND_HEIGHT = 32

/** Lowest and highest plotted value, stacking by sign when series stack. */
function valueExtent(
  data: ChartPoint[],
  keys: string[],
  stacked: boolean
): [number, number] | null {
  let lo = Infinity
  let hi = -Infinity
  for (const p of data) {
    if (stacked) {
      let pos = 0
      let neg = 0
      let any = false
      for (const k of keys) {
        const v = p[k]
        if (v == null) continue
        any = true
        if (v >= 0) pos += v
        else neg += v
      }
      if (!any) continue
      lo = Math.min(lo, neg, pos)
      hi = Math.max(hi, pos, neg)
    } else
      for (const k of keys) {
        const v = p[k]
        if (v == null) continue
        lo = Math.min(lo, v)
        hi = Math.max(hi, v)
      }
  }
  return lo === Infinity ? null : [lo, hi]
}

export function TrendChart({
  data,
  config,
  label,
  loading,
  format = chartNumber,
  kind = "area",
  sparkline = false,
  stacked = false,
  formatTime,
  className,
  baseline = "zero",
  formatTick,
  formatTimeTick,
  curve = "monotone",
  references = [],
  markers = [],
  dashed = [],
  timeTicks: fixedTimeTicks,
  utc = false,
  legend: showLegend,
  integer = false,
}: {
  data: ChartPoint[]
  config: ChartConfig
  label: string
  loading?: boolean
  format?: (value: number) => string
  kind?: "area" | "bar"
  sparkline?: boolean
  /** Stack series; bars stack by sign so negative series grow below zero. */
  stacked?: boolean
  /** Formats `time` (epoch milliseconds) for the tooltip heading, and bar ticks. */
  formatTime?: (time: number) => string
  /** Overrides the chart height, for example `h-40`, or `h-full min-h-56` to fill a card. */
  className?: string
  /**
   * `zero` anchors the value axis at zero; `data` fits it to the series, for
   * levels such as a balance where change matters more than size. Bars and
   * stacks always start at zero.
   */
  baseline?: "zero" | "data"
  /** Value-axis ticks, usually rounder than `format`, which the tooltip keeps. */
  formatTick?: (value: number) => string
  /**
   * Time-axis labels. Area charts otherwise label their calendar-aligned
   * ticks by unit (hours, days, months, years); bar charts use `formatTime`.
   */
  formatTimeTick?: (time: number) => string
  /** `linear` draws straight segments that never overshoot the data. */
  curve?: "monotone" | "linear"
  /**
   * Labelled horizontal lines such as a budget or target, in neutral ink.
   * `side: "axis"` puts the label in the value-axis gutter, clear of bars.
   */
  references?: {
    value: number
    label?: string
    side?: "left" | "right" | "axis"
  }[]
  /**
   * Labelled times such as a target date: a vertical line on an area chart,
   * a shaded bar on a bar chart (for example a month still in progress).
   */
  markers?: { time: number; label?: string }[]
  /** Series keys drawn as dashed lines without fill, such as a projection. */
  dashed?: string[]
  /** Exact time-axis ticks, for a `time` that is not a timestamp (such as day of month). */
  timeTicks?: number[]
  /** Times are calendar dates at UTC midnight; ticks and labels use UTC. */
  utc?: boolean
  /** Name the series below the chart; on by default for two or more. */
  legend?: boolean
  /** Whole-number values such as counts: value ticks step by at least 1. */
  integer?: boolean
}) {
  const height = className ?? (sparkline ? "h-12" : "h-56")
  const [ref, size] = useElementSize<HTMLDivElement>()
  const trigger = useTooltipTrigger()
  const keys = Object.keys(config)
  const negative = data.some((p) => keys.some((k) => (p[k] ?? 0) < 0))
  const empty = !data.some((p) => keys.some((k) => p[k] != null))
  if (loading || empty)
    return (
      <div
        role="status"
        className={`flex items-center justify-center text-sm text-muted-foreground ${height}`}
      >
        {loading ? "Loading history…" : "No history in this range"}
      </div>
    )
  const Plot = kind === "bar" ? BarChart : AreaChart
  const legend = !sparkline && (showLegend ?? keys.length > 1)
  const width = size?.width ?? 600
  const plotWidth = Math.max(80, width - Y_AXIS_WIDTH - MARGIN.right)
  const plotHeight = Math.max(
    60,
    (size?.height ?? 224) -
      X_AXIS_HEIGHT -
      MARGIN.top -
      (legend ? LEGEND_HEIGHT : 0)
  )

  // Value axis: round steps on a domain that hugs the data (and any lines).
  const extent = valueExtent(data, keys, stacked)
  let yScale: NiceScale | undefined
  if (extent && !sparkline) {
    let [lo, hi] = extent
    for (const r of references) {
      lo = Math.min(lo, r.value)
      hi = Math.max(hi, r.value)
    }
    if (baseline === "zero" || kind === "bar" || stacked) {
      lo = Math.min(0, lo)
      hi = Math.max(0, hi)
    }
    const maxTicks = Math.min(7, Math.max(3, Math.round(plotHeight / 36) + 1))
    const minStep = integer ? 1 : 0
    yScale = niceTicks(lo, hi, maxTicks, minStep)
    // Keep a labelled line off the very top so its label stays inside.
    if (references.some((r) => r.label && r.value === yScale!.domain[1]))
      yScale = niceTicks(lo, hi + (hi - lo) / maxTicks, maxTicks, minStep)
  }

  // Time axis: calendar-aligned ticks spaced for the room, labels unclipped.
  const times = data.map((p) => p.time)
  const first = Math.min(...times, ...markers.map((m) => m.time))
  const last = Math.max(...times, ...markers.map((m) => m.time))
  let xTicks: number[] | undefined
  let xLabel: ((time: number) => string) | undefined
  if (!sparkline && kind === "area") {
    if (fixedTimeTicks) {
      xTicks = fixedTimeTicks
      xLabel = formatTimeTick ?? formatTime ?? ((t) => String(t))
    } else {
      const sample = formatTimeTick?.(last) ?? "Nov ’26"
      const maxTicks = Math.max(
        2,
        Math.floor(plotWidth / (labelWidth(sample) + 24))
      )
      const t = timeTicks(first, last, maxTicks, { utc })
      xLabel =
        formatTimeTick ??
        ((time) =>
          formatTickTime(time, t.unit, { utc, crossesYear: t.crossesYear }))
      xTicks = fitTimeTicks(
        t.ticks,
        [first, last],
        plotWidth,
        xLabel,
        MARGIN.right
      )
    }
  } else if (!sparkline) {
    xLabel =
      formatTimeTick ??
      formatTime ??
      ((time) => formatChartTime(time, { month: "short", day: "numeric" }))
    const sample = data.length ? xLabel(data[data.length - 1].time) : ""
    xTicks = everyNth(
      times,
      Math.max(1, Math.floor(plotWidth / (labelWidth(sample) + 16)))
    )
  }
  // The newest bar's label is centred on it; widen the right margin so a
  // long label (such as "Sun 12 PM") is never clipped at the card edge.
  let margin = MARGIN
  if (!sparkline && kind === "bar" && xLabel && data.length) {
    const half = labelWidth(xLabel(data[data.length - 1].time)) / 2
    const overflow = Math.ceil(half - plotWidth / data.length / 2) + 2
    if (overflow > MARGIN.right) margin = { ...MARGIN, right: overflow }
  }

  return (
    <div ref={ref} className={`w-full min-w-0 ${height}`}>
      <ChartContainer
        config={config}
        aria-label={label}
        role="img"
        className="aspect-auto h-full w-full tabular-nums"
      >
        <Plot
          accessibilityLayer
          data={data}
          stackOffset={stacked && kind === "bar" ? "sign" : undefined}
          margin={sparkline ? { left: 0, right: 0, top: 2, bottom: 2 } : margin}
        >
          {!sparkline && <CartesianGrid vertical={false} />}
          {!sparkline && (
            <XAxis
              dataKey="time"
              type={kind === "bar" ? "category" : "number"}
              domain={kind === "bar" ? undefined : [first, last]}
              scale={kind === "bar" ? "auto" : "linear"}
              allowDataOverflow={kind !== "bar"}
              tickLine={false}
              axisLine={false}
              ticks={xTicks}
              interval={0}
              height={X_AXIS_HEIGHT}
              tickFormatter={(value) => {
                const time = chartTimestamp(value)
                if (time === undefined) return "—"
                return xLabel ? xLabel(time) : String(time)
              }}
            />
          )}
          {!sparkline && (
            <YAxis
              width={Y_AXIS_WIDTH}
              domain={yScale?.domain}
              ticks={yScale?.ticks}
              interval={0}
              allowDataOverflow
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTick ?? format}
              tick={{ fontSize: 11, width: 70 }}
            />
          )}
          {sparkline && baseline === "data" ? (
            <YAxis hide domain={["dataMin", "dataMax"]} />
          ) : null}
          {!sparkline && (
            <ChartTooltip
              trigger={trigger}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const time = chartTooltipTime(payload)
                    return time === undefined
                      ? "—"
                      : (formatTime?.(time) ??
                          formatChartTime(time, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }))
                  }}
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-4">
                      <span>{config[String(name)]?.label ?? name}</span>
                      <span className="font-medium tabular-nums">
                        {format(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
          )}
          {legend && (
            <ChartLegend
              // Series order, which is also the stack order from the baseline.
              itemSorter={null}
              content={
                // Whole items wrap to new rows; labels never break mid-name.
                <ChartLegendContent className="flex-wrap gap-x-4 gap-y-1.5 [&>div]:whitespace-nowrap" />
              }
            />
          )}
          {negative && (
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
          )}
          {!sparkline &&
            kind === "bar" &&
            markers.map((m) => (
              <ReferenceArea
                key={`marker-${m.time}`}
                x1={m.time}
                x2={m.time}
                fill="var(--muted-foreground)"
                fillOpacity={0.1}
                label={
                  m.label
                    ? {
                        value: m.label,
                        position: "insideTop",
                        ...LINE_LABEL,
                      }
                    : undefined
                }
              />
            ))}
          {keys.map((key, i) =>
            kind === "bar" ? (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                stackId={stacked ? "stack" : undefined}
                // A surface-coloured edge separates stacked segments.
                stroke={stacked ? "var(--card)" : undefined}
                strokeWidth={stacked ? 1 : undefined}
                radius={stacked ? 2 : 3}
                maxBarSize={48}
                isAnimationActive={false}
              />
            ) : (
              <Area
                key={key}
                dataKey={key}
                type={curve}
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={dashed.includes(key) ? 0 : sparkline ? 0.12 : 0.06}
                strokeWidth={2}
                strokeDasharray={
                  i > 4 || dashed.includes(key) ? "4 3" : undefined
                }
                stackId={stacked ? "stack" : undefined}
                connectNulls={false}
                isAnimationActive={false}
              />
            )
          )}
          {/* Lines and their labels draw over the series so bars never hide them. */}
          {!sparkline &&
            references.map((r) => (
              <ReferenceLine
                key={`${r.value}-${r.label ?? ""}`}
                y={r.value}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={
                  r.label
                    ? {
                        value: r.label,
                        position:
                          r.side === "axis"
                            ? "left"
                            : r.side === "left"
                              ? "insideTopLeft"
                              : "insideTopRight",
                        ...LINE_LABEL,
                      }
                    : undefined
                }
              />
            ))}
          {!sparkline &&
            kind === "area" &&
            markers.map((m) => (
              <ReferenceLine
                key={`marker-${m.time}`}
                x={m.time}
                stroke="var(--muted-foreground)"
                strokeDasharray="2 3"
                strokeWidth={1}
                label={
                  m.label
                    ? {
                        value: m.label,
                        // Past the middle the label sits left of the line, inside the plot.
                        position:
                          last > first &&
                          (m.time - first) / (last - first) > 0.5
                            ? "insideTopRight"
                            : "insideTopLeft",
                        ...LINE_LABEL,
                      }
                    : undefined
                }
              />
            ))}
        </Plot>
      </ChartContainer>
    </div>
  )
}
export function ChartCard({
  title,
  value,
  range,
  onRangeChange,
  ...props
}: React.ComponentProps<typeof TrendChart> & {
  title: string
  value?: React.ReactNode
  range?: ChartRange
  onRangeChange?: (range: ChartRange) => void
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        {value != null && (
          <span className="text-sm font-medium tabular-nums">{value}</span>
        )}
        {range && onRangeChange && (
          <ChartRangeSelect value={range} onChange={onRangeChange} />
        )}
      </CardHeader>
      <CardContent>
        <TrendChart {...props} />
      </CardContent>
    </Card>
  )
}
export function StatChartCard({
  title,
  value,
  ...props
}: React.ComponentProps<typeof TrendChart> & {
  title: string
  value: React.ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </CardHeader>
      <CardContent>
        <TrendChart {...props} sparkline />
      </CardContent>
    </Card>
  )
}
export function BarChartCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} kind="bar" />
}

export type DonutDatum = {
  key: string
  label: string
  value: number
  /** Follows the entity, not its rank; defaults to the slot order. */
  color?: string
}
export type DonutSlice = DonutDatum & { color: string; share: number }

/**
 * Largest first, positive values only; anything past `max` slices folds into
 * one neutral "Other" so the categorical scale never cycles.
 */
export function donutSlices(data: DonutDatum[], max = 5): DonutSlice[] {
  const sorted = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
  const total = sorted.reduce((sum, d) => sum + d.value, 0)
  const kept = sorted.length > max ? sorted.slice(0, max - 1) : sorted
  const rest = sorted.slice(kept.length)
  const slices: DonutSlice[] = kept.map((d, i) => ({
    ...d,
    color: d.color ?? `var(--chart-${i + 1})`,
    share: total ? d.value / total : 0,
  }))
  if (rest.length) {
    const value = rest.reduce((sum, d) => sum + d.value, 0)
    slices.push({
      key: "other",
      label: `Other (${rest.length})`,
      value,
      color: "var(--chart-neutral)",
      share: total ? value / total : 0,
    })
  }
  return slices
}

/** Part-to-whole with the total in the centre and a labelled legend beside it. */
export function DonutChart({
  data,
  label,
  totalLabel = "Total",
  format = chartNumber,
  max = 5,
  loading,
  onSelect,
}: {
  data: DonutDatum[]
  label: string
  totalLabel?: string
  format?: (value: number) => string
  max?: number
  loading?: boolean
  onSelect?: (key: string) => void
}) {
  const slices = donutSlices(data, max)
  const total = slices.reduce((sum, d) => sum + d.value, 0)
  if (loading || !slices.length)
    return (
      <div
        role="status"
        className="flex h-44 items-center justify-center text-sm text-muted-foreground"
      >
        {loading ? "Loading…" : "Nothing in this range"}
      </div>
    )
  const config = Object.fromEntries(
    slices.map((d) => [d.key, { label: d.label, color: d.color }])
  ) satisfies ChartConfig
  return (
    // The legend sits beside the ring only when the card itself is wide enough.
    <div className="@container">
      <div className="grid items-center gap-4 @md:grid-cols-[11rem_minmax(0,1fr)]">
        <ChartContainer
          config={config}
          aria-label={label}
          role="img"
          className="mx-auto aspect-square h-44 tabular-nums"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="key"
                  formatter={(value, _name, item) => (
                    <span className="flex w-full justify-between gap-4">
                      <span>{String(item.payload?.label ?? "")}</span>
                      <span className="font-medium tabular-nums">
                        {format(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="key"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={slices.length > 1 ? 1.5 : 0}
              cornerRadius={3}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
              <Label
                position="center"
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox)) return null
                  const { cx = 0, cy = 0 } = viewBox
                  return (
                    <text x={cx} y={cy} textAnchor="middle">
                      <tspan
                        x={cx}
                        y={cy - 4}
                        className="fill-foreground text-base font-semibold"
                      >
                        {format(total)}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 14}
                        className="fill-muted-foreground text-xs"
                      >
                        {totalLabel}
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="grid min-w-0 gap-0.5 text-sm">
          {slices.map((d) => {
            const content = (
              <>
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: d.color }}
                />
                <span className="min-w-0 flex-1 truncate">{d.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.round(d.share * 100)}%
                </span>
                <span className="w-20 text-right font-medium tabular-nums">
                  {format(d.value)}
                </span>
              </>
            )
            return (
              <li key={d.key}>
                {onSelect && d.key !== "other" ? (
                  <button
                    type="button"
                    onClick={() => onSelect(d.key)}
                    className="flex h-8 w-full items-center gap-2 rounded-md px-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex h-8 items-center gap-2 px-1.5">
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function DonutChartCard({
  title,
  action,
  ...props
}: React.ComponentProps<typeof DonutChart> & {
  title: string
  action?: React.ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        <DonutChart {...props} />
      </CardContent>
    </Card>
  )
}
