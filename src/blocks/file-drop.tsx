import { UploadIcon } from "lucide-react"
import { useId, useState, type DragEvent } from "react"
import { cn } from "cn"

import { formatBytes } from "../lib/format"

/** A labelled drop zone around a real file input, usable by keyboard. */
export function FileDrop({
  accept,
  file,
  onFile,
  disabled,
  invalid,
  label,
}: {
  accept: string
  file: File | null
  onFile: (file: File | null) => void
  disabled?: boolean
  invalid?: boolean
  label: string
}) {
  const id = useId()
  const [over, setOver] = useState(false)

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setOver(false)
    if (!disabled) onFile(event.dataTransfer.files[0] ?? null)
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center text-sm transition-colors hover:bg-muted/50 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/30",
        over && "border-ring bg-muted/50",
        invalid && "border-destructive",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      <UploadIcon className="size-5 text-muted-foreground" aria-hidden="true" />
      {file ? (
        <span>
          <span className="font-medium">{file.name}</span>
          <span className="text-muted-foreground">
            {" "}
            · {formatBytes(file.size)}
          </span>
        </span>
      ) : (
        <span>
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground"> or drop it here</span>
        </span>
      )}
    </label>
  )
}
