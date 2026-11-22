/** A failed API call, carrying the HTTP status and the server's message. */
export class ApiError extends Error {
  readonly status: number
  /** A machine-readable reason from the body's `code`, when the server sends one. */
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    if (code !== undefined) this.code = code
  }
}

export async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    // Non-JSON bodies come from proxies; fall through to a status message.
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : `Request failed (${response.status})`
    const code =
      body &&
      typeof body === "object" &&
      "code" in body &&
      typeof body.code === "string"
        ? body.code
        : undefined
    throw new ApiError(message, response.status, code)
  }
  return body as T
}

export async function getJson<T>(url: string, signal?: AbortSignal) {
  return parseJson<T>(await fetch(url, { signal }))
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}
