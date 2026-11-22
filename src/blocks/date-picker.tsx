import { useState } from "react"
import type { DateRange, Matcher } from "react-day-picker"
import { CalendarIcon, XIcon } from "lucide-react"
import { useIsMobile } from "../hooks/use-mobile"
export * from "../lib/calendar-date"
import { cn } from "../lib/utils"
import {
  formatCalendarDate,
  formatCalendarRange,
  fromCalendarDate,
  toCalendarDate,
  type CalendarDate,
} from "../lib/calendar-date"
import { Button } from "../components/ui/button"
import { Calendar } from "../components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover"

const triggerClass =
  "flex h-8 min-w-0 items-center gap-2 rounded-2xl border border-transparent bg-input/50 px-3 text-left text-base transition-[color,box-shadow] duration-200 outline-none hover:bg-input/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 md:text-sm"

export type DatePreset = {
  label: string
  /** The date the preset picks, or "" for none (such as "No end"). */
  value: CalendarDate | ""
}

/**
 * One date from the calendar in a popover, with optional presets beside it.
 * The value is YYYY-MM-DD or "" for none.
 */
export function DatePicker({
  value,
  onChange,
  presets,
  placeholder = "Pick a date",
  disabled,
  clearable = false,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  value: CalendarDate | ""
  onChange: (value: CalendarDate | "") => void
  presets?: DatePreset[]
  placeholder?: string
  /** Days that cannot be picked, for example `{ before: new Date() }`. */
  disabled?: Matcher | Matcher[]
  clearable?: boolean
  id?: string
  className?: string
  "aria-label"?: string
  "aria-invalid"?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? fromCalendarDate(value) : undefined
  const pick = (next: CalendarDate | "") => {
    onChange(next)
    setOpen(false)
  }
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              id={id}
              aria-label={ariaLabel}
              aria-invalid={ariaInvalid}
              className={cn(
                triggerClass,
                "flex-1",
                !value && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {value ? formatCalendarDate(value) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-auto flex-col gap-0 p-0 sm:flex-row"
          align="start"
        >
          {presets?.length ? (
            <div className="flex flex-wrap gap-1 border-b p-2 sm:w-36 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant={preset.value === value ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => pick(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          ) : null}
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={disabled}
            onSelect={(date) => pick(date ? toCalendarDate(date) : "")}
          />
        </PopoverContent>
      </Popover>
      {clearable && value ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Clear date"
          onClick={() => onChange("")}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  )
}

export type DateRangeValue =
  | { preset: string; from?: never; to?: never }
  | { preset?: never; from?: CalendarDate; to?: CalendarDate }

export type DateRangePreset = { value: string; label: string }

/**
 * Relative presets (kept relative, so a linked view stays current) and a
 * custom inclusive range of calendar days. The app interprets preset values.
 */
export function DateRangePicker({
  value,
  onChange,
  presets,
  placeholder = "Any time",
  className,
  "aria-label": ariaLabel = "Date range",
}: {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  presets: DateRangePreset[]
  placeholder?: string
  className?: string
  "aria-label"?: string
}) {
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()
  const preset = presets.find((p) => p.value === value.preset)
  const label = preset
    ? preset.label
    : formatCalendarRange(value.from, value.to) || placeholder
  const selected: DateRange | undefined =
    draft ??
    (value.from || value.to
      ? {
          from: value.from ? fromCalendarDate(value.from) : undefined,
          to: value.to ? fromCalendarDate(value.to) : undefined,
        }
      : undefined)
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setDraft(undefined)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={`${ariaLabel}: ${label}`}
            className={cn("min-w-0 justify-start", className)}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-auto max-w-[calc(100vw-2rem)] flex-col gap-0 p-0 sm:flex-row"
        align="start"
      >
        <div className="flex flex-wrap gap-1 border-b p-2 sm:w-36 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0">
          {presets.map((p) => (
            <Button
              key={p.value}
              type="button"
              size="sm"
              variant={p.value === value.preset ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => {
                onChange({ preset: p.value })
                setOpen(false)
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-col">
          <Calendar
            mode="range"
            numberOfMonths={mobile ? 1 : 2}
            selected={selected}
            defaultMonth={
              selected?.from ??
              // Two months end on this one; a phone shows this month alone.
              new Date(
                new Date().getFullYear(),
                new Date().getMonth() - (mobile ? 0 : 1)
              )
            }
            disabled={{ after: new Date() }}
            onSelect={(range) => setDraft(range)}
          />
          <div className="flex items-center justify-end gap-2 border-t p-2">
            <span className="mr-auto truncate text-xs text-muted-foreground tabular-nums">
              {draft?.from
                ? formatCalendarRange(
                    toCalendarDate(draft.from),
                    draft.to ? toCalendarDate(draft.to) : undefined
                  )
                : "Pick the first day"}
            </span>
            <Button
              type="button"
              size="sm"
              disabled={!draft?.from}
              onClick={() => {
                if (!draft?.from) return
                const from = toCalendarDate(draft.from)
                onChange({
                  from,
                  to: draft.to ? toCalendarDate(draft.to) : from,
                })
                setOpen(false)
                setDraft(undefined)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
