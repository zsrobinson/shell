import { test } from "node:test"
import assert from "node:assert/strict"
import { ApiError, parseJson, getJson, errorMessage } from "../src/lib/api"
import {
  formatBytes,
  formatDuration,
  formatPercent,
  formatCount,
  pluralize,
  parseTime,
  formatRelative,
  formatDateTime,
} from "../src/lib/format"
import {
  addDays,
  endOfCalendarDay,
  formatCalendarRange,
  fromCalendarDate,
  isCalendarDate,
  toCalendarDate,
} from "../src/lib/calendar-date"
test("API parsing preserves status and handles proxy responses", async () => {
  assert.deepEqual(await parseJson(new Response('{"ok":true}')), { ok: true })
  assert.equal(await parseJson(new Response(null, { status: 204 })), null)
  await assert.rejects(
    parseJson(new Response('{"error":"Denied"}', { status: 403 })),
    (e) => e instanceof ApiError && e.status === 403 && e.message === "Denied"
  )
  await assert.rejects(
    parseJson(new Response("proxy", { status: 502 })),
    /Request failed \(502\)/
  )
  assert.equal(errorMessage(null), "Something went wrong")
  assert.deepEqual(
    await getJson("data:application/json,%7B%22ok%22%3Atrue%7D"),
    { ok: true }
  )
})
test("generic formatting boundaries", () => {
  assert.equal(formatBytes(-1), "—")
  assert.equal(formatBytes(1024), "1.0 KiB")
  assert.equal(formatBytes(0), "0 B")
  assert.equal(formatDuration(90061), "1d 1h")
  assert.equal(formatDuration(-1), "0s")
  assert.equal(formatPercent(9.25), "9.3%")
  assert.equal(pluralize(1, "file"), "1 file")
  assert.equal(pluralize(2, "file"), "2 files")
  assert.equal(pluralize(1681, "file"), (1681).toLocaleString() + " files")
  assert.ok(formatCount(1200))
  assert.equal(
    parseTime("20261120T163807Z-ab12"),
    Date.UTC(2026, 10, 20, 16, 38, 7)
  )
  assert.equal(formatRelative("bad"), "—")
  assert.equal(formatDateTime("bad"), "—")
  assert.equal(formatRelative("2026-01-01", Date.UTC(2026, 0, 1)), "just now")
})

test("class merging uses standard conditional and Tailwind precedence", async () => {
  const { cn } = await import("../src/lib/utils")
  assert.equal(cn("p-4", false, { block: true }, "p-2"), "block p-2")
  assert.equal(
    cn("text-sm", "text-xs", "hover:bg-muted", "hover:bg-accent"),
    "text-xs hover:bg-accent"
  )
})
test("donut slices sort, share and fold into a neutral Other", async () => {
  const { donutSlices } = await import("../src/blocks/chart-card")
  const data = ["a", "b", "c", "d", "e", "f"].map((key, i) => ({
    key,
    label: key,
    value: 60 - i * 10,
  }))
  const slices = donutSlices([...data, { key: "z", label: "z", value: 0 }])
  assert.deepEqual(
    slices.map((s) => s.key),
    ["a", "b", "c", "d", "other"]
  )
  assert.equal(slices[4].value, 30)
  assert.equal(slices[4].color, "var(--chart-neutral)")
  assert.equal(slices[0].color, "var(--chart-1)")
  assert.ok(Math.abs(slices.reduce((s, d) => s + d.share, 0) - 1) < 1e-9)
  assert.equal(donutSlices(data.slice(0, 5)).length, 5)
  assert.equal(
    donutSlices([{ key: "x", label: "x", value: 1, color: "red" }])[0].color,
    "red"
  )
})
test("calendar dates stay local days, never UTC midnights", () => {
  assert.equal(toCalendarDate(fromCalendarDate("2026-11-01")), "2026-11-01")
  assert.equal(fromCalendarDate("2026-03-08").getHours(), 0)
  assert.equal(isCalendarDate("2026-02-30"), false)
  assert.equal(isCalendarDate("2026-2-3"), false)
  assert.equal(isCalendarDate("2026-12-31"), true)
  assert.equal(addDays(7, new Date(2026, 11, 28, 23, 30)), "2027-01-04")
  const end = new Date(endOfCalendarDay("2026-11-29"))
  assert.equal(toCalendarDate(end), "2026-11-29")
  assert.equal(end.getHours(), 23)
  assert.ok(!Number.isNaN(Date.parse(endOfCalendarDay("2026-11-29"))))
  assert.match(formatCalendarRange("2026-11-03", "2026-11-09"), /–/)
  assert.equal(formatCalendarRange(), "")
})
