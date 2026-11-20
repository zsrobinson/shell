import { test } from "node:test"
import assert from "node:assert/strict"
import {
  chartTimestamp,
  chartTooltipTime,
  formatChartTime,
} from "../src/lib/chart-time"
test("tooltip uses numeric point time even when shadcn supplies a series label", () => {
  const time = Date.UTC(2026, 10, 20, 22, 34)
  const payload = [{ name: "alpha", payload: { time, value: 3 } }]
  assert.equal(chartTooltipTime(payload), time)
  assert.equal(
    formatChartTime(
      chartTooltipTime(payload),
      { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" },
      "en-US"
    ),
    "Nov 20, 2026, 10:34 PM"
  )
  assert.equal(
    formatChartTime(
      time,
      { month: "short", day: "numeric", timeZone: "UTC" },
      "en-US"
    ),
    "Nov 20"
  )
})
test("time formatting never parses series labels, date strings or numeric strings", () => {
  for (const value of [
    "alpha",
    "2026-11-20 22:34:00",
    "1795214040000",
    new Date(),
    NaN,
    Infinity,
    9e15,
    undefined,
  ]) {
    assert.equal(chartTimestamp(value), undefined)
    assert.equal(formatChartTime(value), "—")
  }
  assert.equal(chartTooltipTime([{ payload: { time: "alpha" } }]), undefined)
  assert.equal(chartTimestamp(0), 0)
})
