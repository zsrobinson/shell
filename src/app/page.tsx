import type { ComponentProps } from "react"
import { cn } from "cn"

/** The content column. Every app page uses the same width and padding. */
export function Page({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page"
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-(--section-gap) p-(--page-padding) [&_[data-slot=card-header]]:min-h-7 [&_[data-slot=card]]:[--card-spacing:var(--section-gap)] [&_[data-slot=item]]:min-h-11 [&_[data-slot=table-row]]:h-11",
        className
      )}
      {...props}
    />
  )
}

/**
 * A title with real data and actions beside it. There is deliberately no
 * description slot: put status or counts in PageMeta, not prose.
 */
export function PageHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-3",
        className
      )}
      {...props}
    />
  )
}

export function PageTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        "font-heading text-xl leading-8 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

export function PageMeta({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-meta"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export function PageActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

/** Aligned responsive page columns with a single shared spacing scale. */
export function PageGrid({
  layout = "two",
  className,
  ...props
}: ComponentProps<"div"> & { layout?: "one" | "two" | "wide" }) {
  return (
    <div
      data-slot="page-grid"
      className={cn(
        "grid items-start gap-(--section-gap)",
        layout === "two" && "md:grid-cols-2",
        layout === "wide" && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]",
        className
      )}
      {...props}
    />
  )
}
export function PageStack({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-stack"
      className={cn("flex min-w-0 flex-col gap-(--section-gap)", className)}
      {...props}
    />
  )
}
/** Related real Card components share one surface, joined by separators. */
export function SectionGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="section-group"
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10 [&>[data-slot=card]]:rounded-none [&>[data-slot=card]]:shadow-none [&>[data-slot=card]]:ring-0 [&>[data-slot=card]+[data-slot=card]]:border-t",
        className
      )}
      {...props}
    />
  )
}
