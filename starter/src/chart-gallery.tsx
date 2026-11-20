import { useState } from "react"
import {
  ChartCard,
  BarChartCard,
  StatChartCard,
  type ChartRange,
} from "@zsrobinson/shell/blocks/chart-card"
export function ChartGallery() {
  const [range, setRange] = useState<ChartRange>("24h")
  const data = Array.from({ length: 24 }, (_, i) => ({
    time: 1795132800 + i * 3600,
    players: Math.round(8 + 6 * Math.sin(i / 3)),
    backups: 2 + (i % 4),
  }))
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
      <ChartCard
        title="No history yet"
        label="Empty chart example"
        data={[]}
        config={config}
      />
    </div>
  )
}
