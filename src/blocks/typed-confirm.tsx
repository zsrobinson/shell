import { useId, useState, type ReactElement, type ReactNode } from "react"
import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../components/ui/field"
import { Input } from "../components/ui/input"
import { Spinner } from "../components/ui/spinner"
import { errorMessage } from "../lib/api"

type TypedConfirmProps = {
  /** Card title, for example "Delete alpha". */
  title: string
  /** The exact text to type, usually the entity's name. */
  typedName: string
  /** What happens, one short sentence per item. */
  consequences: ReactNode[]
  /** What is kept or saved first, shown as a calm note before the field. */
  safeguards?: ReactNode
  /** Extra fields that belong to the action, such as a seed or a file. */
  children?: ReactNode
  confirmLabel: string
  pendingLabel?: string
  /** A link or button back to where the person came from. */
  cancel: ReactElement
  /** Disable the action for reasons other than the typed name. */
  disabled?: boolean
  /** Resolve when done; reject to keep the page and show the message. */
  onConfirm: () => Promise<unknown>
}

/**
 * A destructive action on its own page: what happens, what is saved first,
 * then the exact name typed before the button unlocks. Enter submits once the
 * name matches; errors stay on the page beside the button.
 */
export function TypedConfirm({
  title,
  typedName,
  consequences,
  safeguards,
  children,
  confirmLabel,
  pendingLabel,
  cancel,
  disabled = false,
  onConfirm,
}: TypedConfirmProps) {
  const inputId = useId()
  const [typed, setTyped] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const matches = typed === typedName
  const mismatch = typed !== "" && !typedName.startsWith(typed)

  async function submit() {
    if (!matches || disabled || pending) return
    setPending(true)
    setError(null)
    try {
      await onConfirm()
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="ring-destructive/25 dark:ring-destructive/30">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <form
        className="contents"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <CardContent className="flex flex-col gap-5">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm marker:text-muted-foreground">
            {consequences.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          {safeguards ? (
            <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
              {safeguards}
            </div>
          ) : null}
          {children}
          <Field data-invalid={mismatch ? true : undefined}>
            <FieldLabel htmlFor={inputId}>
              Type <span className="font-mono">{typedName}</span> to confirm
            </FieldLabel>
            <Input
              id={inputId}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="max-w-sm font-mono"
              aria-invalid={mismatch ? true : undefined}
              disabled={pending}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
            {mismatch ? (
              <FieldError>That does not match the name.</FieldError>
            ) : (
              <FieldDescription>Letters must match exactly.</FieldDescription>
            )}
          </Field>
          {error ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Nothing was changed</AlertTitle>
              <AlertDescription>{errorMessage(error)}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="destructive"
            disabled={!matches || disabled || pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
          {cancel}
        </CardFooter>
      </form>
    </Card>
  )
}
