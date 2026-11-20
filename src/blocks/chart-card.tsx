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
  /** Formats `time` (epoch seconds) for ticks and the tooltip heading. */
  formatTime?: (time: number) => string
  /** Overrides the chart height, for example `h-40`. */
  className?: string
  /**
   * `zero` anchors the value axis at zero; `data` fits it to the series, for
   * levels such as a balance where change matters more than size. Bars and
   * stacks always start at zero.
   */
  baseline?: "zero" | "data"
}) {
  const height = className ?? (sparkline ? "h-12" : "h-56")
  const negative = data.some((p) =>
    Object.keys(config).some((k) => (p[k] ?? 0) < 0)
  )
  if (
    loading ||
    !data.some((p) => Object.keys(config).some((k) => p[k] != null))
  )
    return (
      <div
        role="status"
        className={`flex items-center justify-center text-sm text-muted-foreground ${height}`}
      >
        {loading ? "Loading history…" : "No history in this range"}
      </div>
    )
  const Plot = kind === "bar" ? BarChart : AreaChart
  return (
    <ChartContainer
      config={config}
      aria-label={label}
      role="img"
      className={`aspect-auto w-full tabular-nums ${height}`}
    >
      <Plot
        accessibilityLayer
        data={data}
        stackOffset={stacked && kind === "bar" ? "sign" : undefined}
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
      >
        {!sparkline && <CartesianGrid vertical={false} />}
        {!sparkline && (
          <XAxis
            dataKey="time"
            type={kind === "bar" ? "category" : "number"}
            domain={kind === "bar" ? undefined : ["dataMin", "dataMax"]}
            scale={kind === "bar" ? "auto" : "time"}
            tickLine={false}
            axisLine={false}
            minTickGap={45}
            tickFormatter={(v) =>
              formatTime?.(v) ??
              new Date(v * 1000).toLocaleString(
                undefined,
                data.length > 1 &&
                  data[data.length - 1].time - data[0].time > 172800
                  ? { month: "short", day: "numeric" }
                  : { hour: "numeric", minute: "2-digit" }
              )
            }
          />
        )}
        {!sparkline && (
          <YAxis
            width={72}
            domain={
              baseline === "data" && kind === "area" && !stacked
                ? ["auto", "auto"]
                : undefined
            }
            tickLine={false}
            axisLine={false}
            tickFormatter={format}
            tick={{ fontSize: 11, width: 70 }}
          />
        )}
        {!sparkline && (
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const time = Number(payload?.[0]?.payload?.time)
                  return (
                    formatTime?.(time) ?? new Date(time * 1000).toLocaleString()
                  )
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
        {!sparkline && Object.keys(config).length > 1 && (
          <ChartLegend
            content={
              // Whole items wrap to new rows; labels never break mid-name.
              <ChartLegendContent className="flex-wrap gap-x-4 gap-y-1.5 [&>div]:whitespace-nowrap" />
            }
          />
        )}
        {negative && (
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
        )}
        {Object.keys(config).map((key, i) =>
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
              type="monotone"
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={sparkline ? 0.12 : 0.06}
              strokeWidth={2}
              strokeDasharray={i > 4 ? "4 3" : undefined}
              stackId={stacked ? "stack" : undefined}
              connectNulls={false}
              isAnimationActive={false}
            />
          )
        )}
      </Plot>
    </ChartContainer>
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
