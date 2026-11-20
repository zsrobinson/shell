/** Charts accept epoch milliseconds, never date strings or Date objects. */
export function chartTimestamp(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= 8.64e15
    ? value
    : undefined
}

/** shadcn's label callback receives a series label; time belongs to its payload. */
export function chartTooltipTime(
  payload: readonly unknown[] | undefined
): number | undefined {
  for (const item of payload ?? []) {
    if (!item || typeof item !== "object" || !("payload" in item)) continue
    const point = item.payload
    if (point && typeof point === "object" && "time" in point) {
      const time = chartTimestamp(point.time)
      if (time !== undefined) return time
    }
  }
  return undefined
}

export function formatChartTime(
  time: unknown,
  options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" },
  locales?: string | string[]
): string {
  const timestamp = chartTimestamp(time)
  return timestamp === undefined
    ? "—"
    : new Intl.DateTimeFormat(locales, options).format(timestamp)
}
