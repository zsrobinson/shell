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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../components/ui/field"
import { Input } from "../components/ui/input"
import { Spinner } from "../components/ui/spinner"

type PromptActionProps = {
  /** The element that opens the dialog, usually a Button. */
  trigger?: ReactElement
  /** Control the dialog from outside instead of through a trigger. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  /** One sentence of context, optional. */
  description?: ReactNode
  label: string
  /** Shown under the field while it is valid. */
  hint?: ReactNode
  /** The value the field starts with each time the dialog opens. */
  initialValue?: string
  placeholder?: string
  /** Select the part before the extension when the dialog opens. */
  selectStem?: boolean
  /** Return a message to block submit, or null when the value is fine. */
  validate?: (value: string) => string | null
  confirmLabel: string
  dismissLabel?: string
  /** Resolve to close the dialog; reject to keep it open. */
  onConfirm: (value: string) => Promise<unknown>
}

/**
 * A short dialog with one text field, for names and paths: a new folder,
 * a rename, an archive name. Enter submits; Escape closes.
 */
export function PromptAction({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  label,
  hint,
  initialValue = "",
  placeholder,
  selectStem = false,
  validate,
  confirmLabel,
  dismissLabel = "Cancel",
  onConfirm,
}: PromptActionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const [value, setValue] = useState(initialValue)
  const [pending, setPending] = useState(false)
  const [touched, setTouched] = useState(false)
  const inputId = useId()
  // Start from the initial value each time the dialog opens, however it opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setValue(initialValue)
      setTouched(false)
    }
  }
  const error = validate?.(value.trim()) ?? null
  const showError = touched && error

  function setOpen(next: boolean) {
    if (pending) return
    setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  async function confirm() {
    setTouched(true)
    if (error || pending || !value.trim()) return
    setPending(true)
    try {
      await onConfirm(value.trim())
      setPending(false)
      setUncontrolledOpen(false)
      onOpenChange?.(false)
    } catch {
      // The caller reported the error; keep the dialog open to correct it.
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent showCloseButton={false}>
        <form
          className="contents"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void confirm()
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <Field data-invalid={showError ? true : undefined}>
            <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
            <Input
              id={inputId}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={placeholder}
              aria-invalid={showError ? true : undefined}
              disabled={pending}
              value={value}
              onFocus={(event) => {
                if (!selectStem) return
                const dot = event.currentTarget.value.lastIndexOf(".")
                event.currentTarget.setSelectionRange(
                  0,
                  dot > 0 ? dot : event.currentTarget.value.length
                )
              }}
              onChange={(event) => {
                setValue(event.target.value)
                setTouched(true)
              }}
            />
            {showError ? (
              <FieldError>{error}</FieldError>
            ) : hint ? (
              <FieldDescription>{hint}</FieldDescription>
            ) : null}
          </Field>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={pending} />}
            >
              {dismissLabel}
            </DialogClose>
            <Button
              type="submit"
              disabled={pending || !value.trim() || Boolean(error)}
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
