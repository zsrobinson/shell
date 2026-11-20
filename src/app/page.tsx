import type { ComponentProps } from "react"
import { cn } from "../lib/utils"

/** The content column. Every app page uses the same width and padding. */
export function Page({
  className,
  viewport = false,
  ...props
}: ComponentProps<"div"> & { viewport?: boolean }) {
  return (
    <div
      data-slot="page"
      className={cn(
        "flex w-full max-w-5xl min-w-0 flex-col gap-4 p-4 md:p-6",
        viewport && "h-[calc(100svh-3rem)] min-h-0 max-w-none overflow-hidden",
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
        "flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-3",
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
  layout = "one",
  className,
  ...props
}: ComponentProps<"div"> & { layout?: "one" | "two" | "wide" }) {
  return (
    <div
      data-slot="page-grid"
      className={cn(
        "grid items-start gap-4",
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
      className={cn("flex min-w-0 flex-col gap-4", className)}
      {...props}
    />
  )
}
/** Topic cards remain separate; use a stack instead of joining unrelated surfaces. */
export function SectionGroup(props: ComponentProps<"div">) {
  return <PageStack {...props} />
}
