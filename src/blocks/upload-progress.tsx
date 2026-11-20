import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "../components/ui/progress"

export function UploadProgress({
  fraction,
  label,
}: {
  fraction: number
  label: string
}) {
  return (
    <Progress value={Math.round(fraction * 100)} className="gap-2">
      <ProgressLabel className="text-xs font-normal text-muted-foreground">
        {label}
      </ProgressLabel>
      <ProgressValue className="text-xs" />
    </Progress>
  )
}
