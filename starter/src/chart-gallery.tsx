import { useState } from "react"
import {
  ChartCard,
  BarChartCard,
  StatChartCard,
  DonutChartCard,
  type ChartRange,
} from "@zsrobinson/shell/blocks/chart-card"
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
