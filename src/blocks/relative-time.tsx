import { formatDateTime, formatRelative, parseTime } from "../lib/format"

/**
 * "3 hours ago", with the absolute local time on hover and in `dateTime`.
 * Accepts ISO strings, compact snapshot ids, Minecraft dates or epoch ms.
 */
export function RelativeTime({
  value,
  now,
  className,
}: {
  value: string | number
  now?: number
  className?: string
}) {
  const time = typeof value === "number" ? value : parseTime(value)
  if (!Number.isFinite(time)) return <span className={className}>—</span>
  return (
    <time
      dateTime={new Date(time).toISOString()}
      title={formatDateTime(time)}
      className={className}
    >
      {formatRelative(time, now)}
    </time>
  )
}
