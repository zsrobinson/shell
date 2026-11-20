import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Same contract as the shadcn hook, read synchronously so phones never
// render the desktop sidebar for a frame.
function subscribe(notify: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", notify)
  return () => media.removeEventListener("change", notify)
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
