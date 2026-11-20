import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
export function ChartRangeSelect({
  value,
  onChange,
}: {
  value: ChartRange
  onChange: (value: ChartRange) => void
}) {
  return (
    <select
      aria-label="Chart time range"
      className="h-8 rounded-lg border bg-background px-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as ChartRange)}
    >
      {(["1h", "24h", "7d", "30d"] as const).map((r) => (
        <option key={r} value={r}>
          {r === "1h"
            ? "Last hour"
            : r === "24h"
              ? "Last 24 hours"
              : r === "7d"
                ? "Last 7 days"
                : "Last 30 days"}
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
}: {
  data: ChartPoint[]
  config: ChartConfig
  label: string
  loading?: boolean
  format?: (value: number) => string
  kind?: "area" | "bar"
  sparkline?: boolean
}) {
  if (
    loading ||
    !data.some((p) => Object.keys(config).some((k) => p[k] != null))
  )
    return (
      <div
        role="status"
        className={`flex items-center justify-center text-sm text-muted-foreground ${sparkline ? "h-12" : "h-56"}`}
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
      className={`w-full tabular-nums ${sparkline ? "h-12" : "h-56"}`}
    >
      <Plot
        accessibilityLayer
        data={data}
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
      >
        {!sparkline && <CartesianGrid vertical={false} />}
        {!sparkline && (
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
            tickLine={false}
            axisLine={false}
            minTickGap={45}
            tickFormatter={(v) =>
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
                labelFormatter={(v) =>
                  new Date(Number(v) * 1000).toLocaleString()
                }
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
          <ChartLegend content={<ChartLegendContent />} />
        )}
        {Object.keys(config).map((key, i) =>
          kind === "bar" ? (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key})`}
              radius={3}
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
