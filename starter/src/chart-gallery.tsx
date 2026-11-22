import { useState } from "react"
import {
  ChartCard,
  BarChartCard,
  StatChartCard,
  DonutChartCard,
  type ChartRange,
} from "@zsrobinson/shell/blocks/chart-card"
import {
  SankeyChartCard,
  type SankeyLink,
  type SankeyNode,
} from "@zsrobinson/shell/blocks/sankey-chart"

const groups = [
  {
    id: "home",
    label: "Home",
    color: "var(--chart-2)",
    items: {
      rent: ["Rent", 1850],
      utilities: ["Utilities", 290],
      internet: ["Internet", 70],
    },
  },
  {
    id: "food",
    label: "Food",
    color: "var(--chart-3)",
    items: {
      groceries: ["Groceries", 520],
      dining: ["Dining out", 260],
      coffee: ["Coffee", 80],
    },
  },
  {
    id: "fun",
    label: "Fun",
    color: "var(--chart-4)",
    items: {
      hobbies: ["Hobbies", 190],
      books: ["Books", 75],
      streaming: ["Streaming", 45],
    },
  },
  {
    id: "around",
    label: "Getting around",
    color: "var(--chart-5)",
    items: { transit: ["Transit", 160], rideshare: ["Rideshare", 80] },
  },
] as const
const income = {
  salary: ["Salary", 5200],
  side: ["Side work", 650],
  interest: ["Interest", 40],
} as const
const incomeTotal = Object.values(income).reduce((s, [, v]) => s + v, 0)
const spent = groups.reduce(
  (s, g) => s + Object.values(g.items).reduce((t, [, v]) => t + v, 0),
  0
)
const flowNodes: SankeyNode[] = [
  ...Object.entries(income).map(([id, [label]]) => ({
    id,
    label,
    color: "var(--chart-positive)",
  })),
  { id: "budget", label: "Budget" },
  { id: "saved", label: "Saved", color: "var(--chart-positive)" },
  ...groups.flatMap((g) => [
    { id: g.id, label: g.label, color: g.color },
    ...Object.entries(g.items).map(([id, [label]]) => ({
      id,
      label,
      color: g.color,
    })),
  ]),
]
const flowLinks: SankeyLink[] = [
  ...Object.entries(income).map(([id, [, value]]) => ({
    source: id,
    target: "budget",
    value,
  })),
  { source: "budget", target: "saved", value: incomeTotal - spent },
  ...groups.flatMap((g) => [
    {
      source: "budget",
      target: g.id,
      value: Object.values(g.items).reduce((t, [, v]) => t + v, 0),
    },
    ...Object.entries(g.items).map(([id, [, value]]) => ({
      source: g.id,
      target: id,
      value,
    })),
  ]),
]
const dollars = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v)
export function ChartGallery() {
  const [range, setRange] = useState<ChartRange>("24h")
  const data = Array.from({ length: 24 }, (_, i) => ({
    time: 1795132800000 + i * 3600000,
    players: Math.round(8 + 6 * Math.sin(i / 3)),
    backups: 2 + (i % 4),
  }))
  const monthly = Array.from({ length: 6 }, (_, i) => ({
    time: Date.UTC(2026, 5 + i, 1),
    inflow: 4200 + (i % 3) * 300,
    outflow: -(3100 + ((i * 7) % 5) * 260),
  }))
  const month = (time: number) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      timeZone: "UTC",
    }).format(time)
  const config = { players: { label: "Players", color: "var(--chart-1)" } }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="min-w-0 md:col-span-2">
        <SankeyChartCard
          title="Where November went"
          value={dollars(incomeTotal)}
          label="Example budget flow from income to categories"
          nodes={flowNodes}
          links={flowLinks}
          formatValue={dollars}
          footer={
            <>
              <div className="font-medium">
                Saved {dollars(incomeTotal - spent)}
              </div>
              <div className="text-muted-foreground">
                {Math.round(((incomeTotal - spent) / incomeTotal) * 100)}% of
                income
              </div>
            </>
          }
        />
      </div>
      <ChartCard
        title="Players online"
        label="Example player history"
        data={data}
        config={config}
        range={range}
        onRangeChange={setRange}
      />
      <StatChartCard
        title="Players now"
        value="14"
        label="Example player sparkline"
        data={data}
        config={config}
      />
      <BarChartCard
        title="Backup size"
        label="Example backup sizes"
        data={data}
        config={{ backups: { label: "GB", color: "var(--chart-2)" } }}
      />
      <BarChartCard
        title="Inflow and outflow"
        label="Example monthly inflow and outflow"
        data={monthly}
        stacked
        formatTime={month}
        config={{
          inflow: { label: "Inflow", color: "var(--chart-positive)" },
          outflow: { label: "Outflow", color: "var(--chart-negative)" },
        }}
      />
      <DonutChartCard
        title="Storage by kind"
        label="Example storage share"
        totalLabel="GB used"
        data={[
          { key: "worlds", label: "Worlds", value: 42 },
          { key: "backups", label: "Backups", value: 28 },
          { key: "mods", label: "Mods", value: 9 },
          { key: "logs", label: "Logs", value: 4 },
          { key: "configs", label: "Configs", value: 2 },
          { key: "cache", label: "Cache", value: 1 },
        ]}
      />
      <ChartCard
        title="No history yet"
        label="Empty chart example"
        data={[]}
        config={config}
      />
    </div>
  )
}
