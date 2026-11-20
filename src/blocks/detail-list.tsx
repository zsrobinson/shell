import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

/** Label and value rows, the dense layout used across detail cards. */
export function DetailList({ className, ...props }: ComponentProps<"dl">) {
  return (
    <dl
      className={cn(
        "-my-2 flex flex-col divide-y divide-border/70 text-sm",
        className
      )}
      {...props}
    />
  )
}

export function DetailRow({
  label,
  children,
  className,
}: {
  label: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center justify-between gap-4 py-2",
        className
      )}
    >
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 justify-end text-right font-medium tabular-nums">
        {children}
      </dd>
    </div>
  )
}

export function Unavailable({
  children = "Unavailable",
}: {
  children?: ReactNode
}) {
  return <span className="font-normal text-muted-foreground">{children}</span>
}
