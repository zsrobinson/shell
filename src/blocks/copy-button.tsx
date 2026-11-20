import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { toast } from "../index"
import { Button } from "../components/ui/button"

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
        } catch {
          toast.error("Copy failed. Select the text and copy it instead.")
        }
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}
