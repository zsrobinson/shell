/** A failed API call, carrying the HTTP status and the server's message. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
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
    throw new ApiError(message, response.status)
  }
  return body as T
}

export async function getJson<T>(url: string, signal?: AbortSignal) {
  return parseJson<T>(await fetch(url, { signal }))
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}
