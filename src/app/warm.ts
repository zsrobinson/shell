const warmed = new Set<string>()

/**
 * Preconnect to another app's origin and prefetch its entry document, so a
 * switch feels instant. Called on hover and keyboard focus. Only http(s)
 * targets are touched, and each URL is warmed once per page load.
 */
export function warmUrl(href: string) {
  let url: URL
  try {
    url = new URL(href, location.href)
  } catch {
    return
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return
  if (url.origin === location.origin || warmed.has(url.href)) return
  warmed.add(url.href)

  const preconnect = document.createElement("link")
  preconnect.rel = "preconnect"
  preconnect.href = url.origin
  preconnect.crossOrigin = "use-credentials"

  const prefetch = document.createElement("link")
  prefetch.rel = "prefetch"
  prefetch.href = url.href

  document.head.append(preconnect, prefetch)
}

export function isCurrentApp(href: string) {
  try {
    return new URL(href, location.href).origin === location.origin
  } catch {
    return false
  }
}
