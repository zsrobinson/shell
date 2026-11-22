/**
 * Axis ticks every chart shares: round value steps (1, 2, 2.5 or 5 × 10ⁿ) on
 * a domain that hugs the data, and calendar-aligned time ticks (hours, the
 * 1st/8th/15th/22nd/29th, month starts, years) spaced evenly for the room.
 */

const STEPS = [1, 2, 2.5, 5]

/** Removes float noise such as 0.30000000000000004. */
const clean = (n: number) => Number(n.toPrecision(12))

export type NiceScale = { domain: [number, number]; ticks: number[] }

/**
 * The tightest domain on round steps that covers `min`..`max` with at most
 * `maxTicks` ticks. Equal bounds widen around the value. `minStep` keeps
 * steps at or above it, such as 1 for counts.
 */
export function niceTicks(
  min: number,
  max: number,
  maxTicks = 5,
  minStep = 0
): NiceScale {
  if (!Number.isFinite(min) || !Number.isFinite(max))
    return { domain: [0, 1], ticks: [0, 1] }
  if (min > max) [min, max] = [max, min]
  // A flat series sits on a range from zero.
  if (min === max) {
    if (min > 0) min = 0
    else if (max < 0) max = 0
    else max = 1
  }
  const count = Math.max(2, Math.floor(maxTicks))
  const rough = (max - min) / (count - 1)
  let decade = 10 ** Math.floor(Math.log10(rough))
  for (let guard = 0; guard < 40; guard++) {
    for (const m of STEPS) {
      const step = clean(m * decade)
      if (step < minStep) continue
      const lo = Math.floor(clean(min / step)) * step
      const hi = Math.ceil(clean(max / step)) * step
      const n = Math.round((hi - lo) / step) + 1
      if (n <= count) {
        const ticks = Array.from({ length: n }, (_, i) => clean(lo + i * step))
        return { domain: [ticks[0], ticks[n - 1]], ticks }
      }
    }
    decade *= 10
  }
  return { domain: [min, max], ticks: [min, max] }
}

export type TimeUnit = "hour" | "day" | "month" | "year"
export type TimeTicks = {
  ticks: number[]
  unit: TimeUnit
  crossesYear: boolean
}

const HOUR = 3_600_000
const DAY = 86_400_000

type Parts = { y: number; m: number; d: number; h: number }
function parts(time: number, utc: boolean): Parts {
  const t = new Date(time)
  return utc
    ? {
        y: t.getUTCFullYear(),
        m: t.getUTCMonth(),
        d: t.getUTCDate(),
        h: t.getUTCHours(),
      }
    : { y: t.getFullYear(), m: t.getMonth(), d: t.getDate(), h: t.getHours() }
}
const make = (utc: boolean, y: number, m: number, d = 1, h = 0) =>
  utc ? Date.UTC(y, m, d, h) : new Date(y, m, d, h).getTime()

/** Every calendar boundary of one kind between two times, inclusive. */
function boundaries(
  first: number,
  last: number,
  utc: boolean,
  unit: TimeUnit,
  every: number
) {
  const out: number[] = []
  const p = parts(first, utc)
  const limit = 400
  if (unit === "hour") {
    for (
      let t = make(utc, p.y, p.m, p.d, 0);
      t <= last && out.length < limit;
      t += HOUR
    )
      if (t >= first && parts(t, utc).h % every === 0) out.push(t)
  } else if (unit === "day") {
    // Days of the month restart each month, so weekly ticks are the 1st, 8th,
    // 15th, 22nd and 29th rather than drifting across month ends.
    for (
      let t = make(utc, p.y, p.m, p.d);
      t <= last && out.length < limit;
      t += DAY
    ) {
      const d = parts(t, utc).d
      const keep =
        every === 14
          ? d === 1 || d === 15
          : (d - 1) % every === 0 && (every === 1 || d <= 29)
      if (t >= first && keep) out.push(t)
    }
  } else if (unit === "month") {
    for (let i = 0; out.length < limit; i++) {
      const t = make(utc, p.y, p.m + i, 1)
      if (t > last) break
      if (t >= first && parts(t, utc).m % every === 0) out.push(t)
    }
  } else {
    for (let y = p.y; out.length < limit; y++) {
      const t = make(utc, y, 0, 1)
      if (t > last) break
      if (t >= first && y % every === 0) out.push(t)
    }
  }
  return out
}

const CANDIDATES: { unit: TimeUnit; every: number; maxSpanDays: number }[] = [
  { unit: "hour", every: 1, maxSpanDays: 2 },
  { unit: "hour", every: 2, maxSpanDays: 2 },
  { unit: "hour", every: 3, maxSpanDays: 3 },
  { unit: "hour", every: 6, maxSpanDays: 4 },
  { unit: "hour", every: 12, maxSpanDays: 5 },
  { unit: "day", every: 1, maxSpanDays: 62 },
  { unit: "day", every: 2, maxSpanDays: 62 },
  { unit: "day", every: 7, maxSpanDays: 62 },
  { unit: "day", every: 14, maxSpanDays: 62 },
  { unit: "month", every: 1, maxSpanDays: Infinity },
  { unit: "month", every: 2, maxSpanDays: Infinity },
  { unit: "month", every: 3, maxSpanDays: Infinity },
  { unit: "month", every: 6, maxSpanDays: Infinity },
  { unit: "year", every: 1, maxSpanDays: Infinity },
  { unit: "year", every: 2, maxSpanDays: Infinity },
  { unit: "year", every: 5, maxSpanDays: Infinity },
  { unit: "year", every: 10, maxSpanDays: Infinity },
]

/**
 * Calendar-aligned ticks between two epoch times, at most `maxTicks`: the
 * finest even step that fits. Spans over two months tick by month or more.
 */
export function timeTicks(
  first: number,
  last: number,
  maxTicks: number,
  { utc = false }: { utc?: boolean } = {}
): TimeTicks {
  const spanDays = (last - first) / DAY
  const crossesYear = parts(first, utc).y !== parts(last, utc).y
  const max = Math.max(1, Math.floor(maxTicks))
  for (const c of CANDIDATES) {
    if (spanDays > c.maxSpanDays) continue
    const ticks = boundaries(first, last, utc, c.unit, c.every)
    if (ticks.length && ticks.length <= max)
      return { ticks, unit: c.unit, crossesYear }
  }
  return { ticks: [first], unit: "year", crossesYear }
}

/** A short label for a tick of the given unit. */
export function formatTimeTick(
  time: number,
  unit: TimeUnit,
  {
    utc = false,
    crossesYear = false,
  }: { utc?: boolean; crossesYear?: boolean } = {},
  locales?: string | string[]
) {
  const timeZone = utc ? "UTC" : undefined
  if (unit === "hour")
    return new Intl.DateTimeFormat(locales, {
      hour: "numeric",
      timeZone,
    }).format(time)
  if (unit === "day")
    return new Intl.DateTimeFormat(locales, {
      month: "short",
      day: "numeric",
      timeZone,
    }).format(time)
  if (unit === "year")
    return new Intl.DateTimeFormat(locales, {
      year: "numeric",
      timeZone,
    }).format(time)
  const month = new Intl.DateTimeFormat(locales, {
    month: "short",
    timeZone,
  }).format(time)
  if (!crossesYear) return month
  const year = new Intl.DateTimeFormat(locales, {
    year: "2-digit",
    timeZone,
  }).format(time)
  return `${month} ’${year}`
}

/** Rough rendered width of an axis label at the chart's 12px type. */
export const labelWidth = (text: string) => Math.ceil(text.length * 6.6) + 4

/**
 * Drops time ticks whose centred label would run past the plot's right edge
 * (the left edge has the value axis to spill into).
 */
export function fitTimeTicks(
  ticks: number[],
  [first, last]: [number, number],
  plotWidth: number,
  label: (time: number) => string,
  rightRoom = 8
) {
  if (last <= first) return ticks
  return ticks.filter((t) => {
    const x = ((t - first) / (last - first)) * plotWidth
    return plotWidth - x + rightRoom >= labelWidth(label(t)) / 2
  })
}

/** Evenly spaced category ticks, always including the last (latest) one. */
export function everyNth<T>(values: T[], maxTicks: number): T[] {
  if (values.length <= maxTicks) return values
  const step = Math.ceil(values.length / Math.max(1, Math.floor(maxTicks)))
  const out: T[] = []
  for (let i = values.length - 1; i >= 0; i -= step) out.unshift(values[i])
  return out
}
