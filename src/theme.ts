import { useSyncExternalStore } from "react"

/**
 * Light and dark follow the operating system unless the person picks one.
 * The choice is stored per origin. CSS handles the system case on its own,
 * so the first paint is already correct before any script runs.
 */
export type ThemePreference = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

const STORAGE_KEY = "shell-theme"
const DARK_QUERY = "(prefers-color-scheme: dark)"
const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

let preference: ThemePreference =
  typeof window === "undefined" ? "system" : readPreference()

function applyPreference(value: ThemePreference) {
  const root = document.documentElement
  root.classList.toggle("dark", value === "dark")
  root.classList.toggle("light", value === "light")
}

if (typeof document !== "undefined") {
  applyPreference(preference)
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return
    preference = readPreference()
    applyPreference(preference)
    listeners.forEach((notify) => notify())
  })
}

export function setThemePreference(value: ThemePreference) {
  preference = value
  try {
    if (value === "system") localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage can be unavailable; the choice still applies to this tab.
  }
  applyPreference(value)
  listeners.forEach((notify) => notify())
}

function subscribePreference(notify: () => void) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribePreference,
    () => preference,
    () => "system"
  )
}

function subscribeSystem(notify: () => void) {
  const media = matchMedia(DARK_QUERY)
  media.addEventListener("change", notify)
  return () => media.removeEventListener("change", notify)
}

function useSystemPrefersDark() {
  return useSyncExternalStore(
    subscribeSystem,
    () => matchMedia(DARK_QUERY).matches,
    () => false
  )
}

export function useResolvedTheme(): ResolvedTheme {
  const chosen = useThemePreference()
  const systemDark = useSystemPrefersDark()
  if (chosen === "system") return systemDark ? "dark" : "light"
  return chosen
}
