import { useState, type ReactNode } from "react"
import { ChevronDownIcon, XIcon } from "lucide-react"
import { cn } from "../lib/utils"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover"

/** A row of filter controls that wraps on narrow screens. */
export function FilterBar({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      role="group"
      aria-label="Filters"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {children}
    </div>
  )
}

export type FilterChip = {
  id: string
  /** What the filter is, such as "Tool". */
  label: string
  /** The chosen value, such as "Archive, Move". */
  value: ReactNode
  onRemove: () => void
}

/** Active filters as removable chips, with one control to clear them all. */
export function FilterChips({
  chips,
  onClear,
  className,
}: {
  chips: FilterChip[]
  onClear?: () => void
  className?: string
}) {
  if (chips.length === 0) return null
  return (
    <ul
      aria-label="Active filters"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {chips.map((chip) => (
        <li key={chip.id}>
          <Badge variant="secondary" className="h-6 gap-1 pr-0.5 pl-2.5">
            <span className="text-muted-foreground">{chip.label}</span>
            <span className="max-w-48 truncate">{chip.value}</span>
            <Button
              size="icon-xs"
              variant="ghost"
              className="size-5 rounded-full"
              aria-label={`Remove ${chip.label} filter`}
              onClick={chip.onRemove}
            >
              <XIcon />
            </Button>
          </Badge>
        </li>
      ))}
      {onClear && chips.length > 1 ? (
        <li>
          <Button size="xs" variant="ghost" onClick={onClear}>
            Clear all
          </Button>
        </li>
      ) : null}
    </ul>
  )
}

export type MultiSelectOption = {
  value: string
  label: string
  group?: string
  icon?: ReactNode
}

/**
 * A filter of several values from a searchable list. With nothing chosen it
 * reads as "all"; the trigger shows how many are chosen.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  searchPlaceholder,
  className,
}: {
  /** The filter's name, shown on the trigger. */
  label: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  searchPlaceholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const chosen = new Set(value)
  const groups: { name?: string; options: MultiSelectOption[] }[] = []
  for (const option of options) {
    const last = groups.at(-1)
    if (last && last.name === option.group) last.options.push(option)
    else groups.push({ name: option.group, options: [option] })
  }
  const toggle = (item: string) =>
    onChange(
      options
        .map((o) => o.value)
        .filter((v) => (v === item ? !chosen.has(v) : chosen.has(v)))
    )
  const single =
    value.length === 1 ? options.find((o) => o.value === value[0]) : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("min-w-0", className)}
          />
        }
      >
        <span className="truncate">{single ? single.label : label}</span>
        {value.length > 1 ? (
          <Badge variant="secondary" className="tabular-nums">
            {value.length}
          </Badge>
        ) : null}
        <ChevronDownIcon data-icon="inline-end" className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}`}
          />
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            {groups.map((group, index) => (
              <CommandGroup key={group.name ?? index} heading={group.name}>
                {group.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    data-checked={chosen.has(option.value)}
                    onSelect={() => toggle(option.value)}
                  >
                    {option.icon}
                    {option.label}
                    {chosen.has(option.value) ? (
                      <span className="sr-only">, selected</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {value.length ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear"
                    onSelect={() => {
                      onChange([])
                      setOpen(false)
                    }}
                    className="justify-center text-muted-foreground"
                  >
                    Clear {label.toLowerCase()}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
