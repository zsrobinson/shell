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
} from "../components/ui/command"
import { type NavGroup, selectNavLink } from "./navigation"
export function CommandPalette({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [])
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
        onOpenChange={setOpen}
        title="Jump to"
        description="Pages and entity actions"
      >
        <Command>
          <CommandInput placeholder="Jump to a server or page…" />
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.id} heading={group.label}>
                {group.items.map((item) => (
                  <div key={item.id}>
                    <CommandItem
                      value={item.label}
                      onSelect={() => {
                        setOpen(false)
                        selectNavLink(item)
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </CommandItem>
                    {item.children?.map((child) => (
                      <CommandItem
                        key={child.id}
                        value={`${item.label} ${child.label}`}
                        onSelect={() => {
                          setOpen(false)
                          selectNavLink(child)
                        }}
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
                            value={`${item.label} ${action.label}`}
                            onSelect={() => {
                              setOpen(false)
                              action.onSelect()
                            }}
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
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
