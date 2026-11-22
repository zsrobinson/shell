import { test } from "node:test"
import assert from "node:assert/strict"
import {
  everyNth,
  fitTimeTicks,
  formatTimeTick,
  niceTicks,
  timeTicks,
} from "../src/lib/chart-ticks"

const day = (s: string) => Date.parse(`${s}T00:00:00Z`)
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

test("value ticks use round steps on a domain that hugs the data", () => {
  // A level series: no $153k/$162k, and no zero baseline flattening it.
  assert.deepEqual(
    niceTicks(153_400, 189_100, 5).ticks,
    [150_000, 160_000, 170_000, 180_000, 190_000]
  )
  // Spending from zero: $500 steps, never $450/$900/$1.4k.
  assert.deepEqual(niceTicks(0, 1_790, 5).ticks, [0, 500, 1000, 1500, 2000])
  // Mixed signs keep zero on a tick and stay tight.
  const mixed = niceTicks(-12_115, 199_159, 6)
  assert.ok(mixed.ticks.includes(0))
  assert.deepEqual(mixed.domain, [-50_000, 200_000])
  for (const { ticks } of [
    niceTicks(0, 7.3, 5),
    niceTicks(-3, 3, 4),
    niceTicks(129_000, 141_000, 5),
  ]) {
    const steps = new Set(
      ticks.slice(1).map((t, i) => Number((t - ticks[i]).toPrecision(6)))
    )
    assert.equal(steps.size, 1, "evenly spaced")
    const step = [...steps][0]
    const mantissa = step / 10 ** Math.floor(Math.log10(step))
    assert.ok([1, 2, 2.5, 5].includes(Number(mantissa.toPrecision(3))))
  }
  assert.deepEqual(niceTicks(5, 5, 5).ticks.at(-1)! >= 5, true)
  assert.deepEqual(niceTicks(0, 0, 3).ticks, [0, 0.5, 1])
})

test("time ticks fall on even calendar steps for the room", () => {
  // Six months by month, never May/Jul/Aug/Oct/Nov gaps.
  const six = timeTicks(day("2026-05-20"), day("2026-11-18"), 7, { utc: true })
  assert.equal(six.unit, "month")
  assert.deepEqual(six.ticks.map(iso), [
    "2026-06-01",
    "2026-07-01",
    "2026-08-01",
    "2026-09-01",
    "2026-10-01",
    "2026-11-01",
  ])
  // A phone fits fewer: every other month, still evenly, ending this month.
  const narrow = timeTicks(day("2026-05-20"), day("2026-11-18"), 3, {
    utc: true,
  })
  assert.deepEqual(narrow.ticks.map(iso), [
    "2026-07-01",
    "2026-09-01",
    "2026-11-01",
  ])
  // A month by the 1st, 8th, 15th, 22nd and 29th.
  const month = timeTicks(day("2026-10-19"), day("2026-11-18"), 6, {
    utc: true,
  })
  assert.equal(month.unit, "day")
  assert.deepEqual(month.ticks.map(iso), [
    "2026-10-22",
    "2026-10-29",
    "2026-11-01",
    "2026-11-08",
    "2026-11-15",
  ])
  // Across a year boundary, month labels carry the year.
  const year = timeTicks(day("2025-11-18"), day("2026-11-18"), 7, {
    utc: true,
  })
  assert.ok(year.crossesYear)
  assert.equal(
    formatTimeTick(
      year.ticks[0],
      year.unit,
      { utc: true, crossesYear: true },
      "en-US"
    ),
    "Jan ’26"
  )
  // Hours for a day of data.
  const hours = timeTicks(
    Date.UTC(2026, 10, 20, 1),
    Date.UTC(2026, 10, 20, 23),
    6,
    {
      utc: true,
    }
  )
  assert.equal(hours.unit, "hour")
  assert.ok(hours.ticks.every((t) => new Date(t).getUTCHours() % 6 === 0))
})

test("labels that would clip at the right edge are dropped", () => {
  const first = day("2026-08-19")
  const last = day("2026-11-18")
  const ticks = [day("2026-09-01"), day("2026-10-01"), day("2026-11-17")]
  const kept = fitTimeTicks(ticks, [first, last], 300, () => "Nov 17")
  assert.deepEqual(kept.map(iso), ["2026-09-01", "2026-10-01"])
})

test("category ticks are evenly spaced and keep the latest", () => {
  const months = Array.from({ length: 12 }, (_, i) => i)
  assert.deepEqual(everyNth(months, 4), [2, 5, 8, 11])
  assert.deepEqual(everyNth(months, 20), months)
})

test("count charts never get fractional ticks", () => {
  assert.deepEqual(niceTicks(0, 2, 5, 1).ticks, [0, 1, 2])
  assert.deepEqual(niceTicks(0, 1, 5, 1).ticks, [0, 1])
  assert.deepEqual(niceTicks(0, 2, 5).ticks, [0, 0.5, 1, 1.5, 2])
  assert.deepEqual(niceTicks(0, 40, 5, 1).ticks, [0, 10, 20, 30, 40])
})
