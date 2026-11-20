import type { ComponentProps } from "react"
import { cn } from "cn"

/** The content column. Every app page uses the same width and padding. */
export function Page({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page"
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8",
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
        "flex flex-wrap items-start justify-between gap-x-6 gap-y-3",
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
