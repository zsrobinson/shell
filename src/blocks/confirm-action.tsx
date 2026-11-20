import { useId, useState, type ReactElement, type ReactNode } from "react"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Field, FieldLabel } from "../components/ui/field"
import { Input } from "../components/ui/input"
import { Spinner } from "../components/ui/spinner"

type ConfirmActionProps = {
  /** The element that opens the dialog, usually a Button. */
  trigger?: ReactElement
  /** Control the dialog from outside instead of through a trigger. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  /** One or two sentences on what will happen. */
  children: ReactNode
  confirmLabel: string
  destructive?: boolean
  /** When set, the person must type this exact text before confirming. */
  typedName?: string
  /** Resolve to close the dialog; reject to keep it open. */
  onConfirm: () => Promise<unknown>
}

/** A short confirmation. Longer flows belong on their own page. */
export function ConfirmAction({
  trigger,
  title,
  children,
  confirmLabel,
  destructive = false,
  typedName,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: ConfirmActionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next)
    onOpenChange?.(next)
  }
  const [pending, setPending] = useState(false)
  const [typed, setTyped] = useState("")
  const inputId = useId()
  const ready = !typedName || typed === typedName

  async function confirm() {
    if (!ready || pending) return
    setPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      // The mutation already reported the error; keep the dialog open.
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        if (!next) setTyped("")
      }}
    >
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent showCloseButton={false}>
        <form
          className="contents"
          onSubmit={(event) => {
            // React bubbles portal events; keep this submit out of outer forms.
            event.preventDefault()
            event.stopPropagation()
            void confirm()
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{children}</DialogDescription>
          </DialogHeader>
          {typedName ? (
            <Field>
              <FieldLabel htmlFor={inputId}>
                Type <span className="font-mono">{typedName}</span> to confirm
              </FieldLabel>
              <Input
                id={inputId}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
            </Field>
          ) : null}
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={pending} />}
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={!ready || pending}
              autoFocus={!typedName}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
