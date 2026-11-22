/** A calendar date as YYYY-MM-DD, in the viewer's time zone. */
export type CalendarDate = string

export function toCalendarDate(date: Date): CalendarDate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** Local midnight of a YYYY-MM-DD date; never parsed as UTC. */
export function fromCalendarDate(value: CalendarDate) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  return toCalendarDate(fromCalendarDate(value)) === value
}

/** Today plus a number of days, as a calendar date. */
export function addDays(days: number, from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  date.setDate(date.getDate() + days)
  return toCalendarDate(date)
}

const medium = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })
const short = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
})

export function formatCalendarDate(value: CalendarDate) {
  return medium.format(fromCalendarDate(value))
}

/** "Nov 3 – Nov 9", or one end when the other is open. */
export function formatCalendarRange(from?: CalendarDate, to?: CalendarDate) {
  if (from && to)
    return from === to
      ? formatCalendarDate(from)
      : `${short.format(fromCalendarDate(from))} – ${medium.format(fromCalendarDate(to))}`
  if (from) return `From ${formatCalendarDate(from)}`
  if (to) return `Until ${formatCalendarDate(to)}`
  return ""
}

/** The end of a calendar day in the viewer's zone, as an ISO instant. */
export function endOfCalendarDay(value: CalendarDate) {
  const date = fromCalendarDate(value)
  date.setHours(23, 59, 59, 0)
  return date.toISOString()
}

/** The viewer's IANA time zone, such as America/New_York. */
export function viewerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}
