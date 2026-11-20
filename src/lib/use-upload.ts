import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { errorMessage } from "./api"

export type UploadVariables = {
  file: File
  params?: Record<string, string | undefined>
}

/** Progress and notification state; transport and cache ownership stay with the app. */
export function useUpload({
  mutationKey,
  upload,
  success,
  onSettled,
}: {
  mutationKey: readonly unknown[]
  upload: (
    variables: UploadVariables,
    onProgress: (fraction: number) => void
  ) => Promise<unknown>
  success: (file: File) => string
  onSettled?: () => void | Promise<unknown>
}) {
  const [progress, setProgress] = useState(0)
  const mutation = useMutation({
    mutationKey,
    mutationFn: (variables: UploadVariables) => {
      setProgress(0)
      return upload(variables, setProgress)
    },
    onSuccess: (_, { file }) => toast.success(success(file)),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => onSettled?.(),
  })
  return { ...mutation, progress }
}
export const MAX_UPLOAD_BYTES = 512 * 1024 * 1024
