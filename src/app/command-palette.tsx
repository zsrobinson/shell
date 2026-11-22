import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "../components/ui/command"
import { Spinner } from "../components/ui/spinner"
import { type NavGroup, selectNavLink } from "./navigation"

/**
 * Results that depend on the typed query, such as transactions or files.
 * The app fetches them in `onQueryChange` (debouncing as it sees fit) and
 * passes them back in `groups`; the palette shows them as given, without
 * filtering them again, while its static groups keep filtering as before.
 */
export type CommandSearch = {
  /** Called on every keystroke, and with "" when the palette closes. */
  onQueryChange: (query: string) => void
  groups: NavGroup[]
  /** Shows a loading row under the results while a search is in flight. */
  loading?: boolean
}

export function CommandPalette({
  groups,
  placeholder = "Jump to a server or page…",
  search,
}: {
  groups: NavGroup[]
  placeholder?: string
  search?: CommandSearch
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const onQueryChange = search?.onQueryChange
  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery("")
      onQueryChange?.("")
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (open) {
          setQuery("")
          onQueryChange?.("")
        }
        setOpen(!open)
      }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [open, onQueryChange])
  const select = (run: () => void) => {
    changeOpen(false)
    run()
  }
  const results = search?.groups.filter((g) => g.items.length) ?? []
  const renderGroup = (group: NavGroup, dynamic: boolean) => {
    // Dynamic results bypass cmdk's filter; unique values keep them distinct
    // from a static item with the same label.
    const value = (label: string, id: string) =>
      dynamic ? `${label} ${group.id}:${id}` : label
    return (
      <CommandGroup
        key={`${dynamic ? "search" : "static"}:${group.id}`}
        heading={group.label}
        forceMount={dynamic || undefined}
      >
        {group.items.map((item) => (
          <div key={item.id}>
            <CommandItem
              // Static items carry their id too, so two with one label stay distinct.
              value={
                dynamic
                  ? value(item.label, item.id)
                  : `${item.label} ${item.id}`
              }
              keywords={item.keywords}
              forceMount={dynamic || undefined}
              onSelect={() => select(() => selectNavLink(item))}
            >
              {item.icon}
              {item.label}
              {dynamic && item.badge !== undefined ? (
                <CommandShortcut className="tracking-normal tabular-nums">
                  {item.badge}
                </CommandShortcut>
              ) : null}
            </CommandItem>
            {item.children?.map((child) => (
              <CommandItem
                key={child.id}
                value={value(`${item.label} ${child.label}`, child.id)}
                keywords={child.keywords}
                forceMount={dynamic || undefined}
                onSelect={() => select(() => selectNavLink(child))}
              >
                {child.icon}
                <span>
                  {item.label} / {child.label}
                </span>
              </CommandItem>
            ))}
            {item.actions?.length ? (
              <>
                <CommandSeparator />
                {item.actions.map((action) => (
                  <CommandItem
                    key={action.id}
                    disabled={action.disabled}
                    value={value(`${item.label} ${action.label}`, action.id)}
                    forceMount={dynamic || undefined}
                    onSelect={() => select(action.onSelect)}
                  >
                    {action.icon}
                    {item.label} / {action.label}
                  </CommandItem>
                ))}
              </>
            ) : null}
          </div>
        ))}
      </CommandGroup>
    )
  }
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Commands (⌘K)"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={changeOpen}
        title="Jump to"
        description="Pages and entity actions"
      >
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={(q) => {
              setQuery(q)
              onQueryChange?.(q)
            }}
          />
          <CommandList>
            {search ? (
              // cmdk counts only filtered items; dynamic results count too.
              !results.length && !search.loading ? (
                <CommandEmpty>No matches</CommandEmpty>
              ) : null
            ) : (
              <CommandEmpty>No matches</CommandEmpty>
            )}
            {groups.map((group) => renderGroup(group, false))}
            {results.map((group) => renderGroup(group, true))}
            {search?.loading ? (
              <div
                role="status"
                data-slot="command-loading"
                className="flex min-h-7 items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
              >
                <Spinner className="size-3.5" aria-hidden />
                Searching…
              </div>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
