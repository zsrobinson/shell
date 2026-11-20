import { useState, type ReactNode } from "react"
import { cn } from "cn"

import { isHue, type Hue } from "./types"

// Literal class strings so Tailwind can see them. Light 600, dark 400.
const HUE_TILES: Record<Hue, string> = {
  re: "bg-(--flexoki-red-600) text-(--flexoki-paper) dark:bg-(--flexoki-red-400) dark:text-(--flexoki-black)",
  or: "bg-(--flexoki-orange-600) text-(--flexoki-paper) dark:bg-(--flexoki-orange-400) dark:text-(--flexoki-black)",
  ye: "bg-(--flexoki-yellow-600) text-(--flexoki-paper) dark:bg-(--flexoki-yellow-400) dark:text-(--flexoki-black)",
  gr: "bg-(--flexoki-green-600) text-(--flexoki-paper) dark:bg-(--flexoki-green-400) dark:text-(--flexoki-black)",
  cy: "bg-(--flexoki-cyan-600) text-(--flexoki-paper) dark:bg-(--flexoki-cyan-400) dark:text-(--flexoki-black)",
  bl: "bg-(--flexoki-blue-600) text-(--flexoki-paper) dark:bg-(--flexoki-blue-400) dark:text-(--flexoki-black)",
  pu: "bg-(--flexoki-purple-600) text-(--flexoki-paper) dark:bg-(--flexoki-purple-400) dark:text-(--flexoki-black)",
  ma: "bg-(--flexoki-magenta-600) text-(--flexoki-paper) dark:bg-(--flexoki-magenta-400) dark:text-(--flexoki-black)",
}

const IMAGE_URL = /^(https?:\/\/|\/)/

export function AppIcon({
  name,
  icon,
  colour,
  className,
}: {
  name: string
  icon?: string | ReactNode
  colour?: string
  className?: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const tone = isHue(colour)
    ? HUE_TILES[colour]
    : colour
      ? "text-(--flexoki-paper)"
      : "bg-primary text-primary-foreground"

  let content: ReactNode = name.trim().charAt(0).toUpperCase()
  if (typeof icon === "string" && IMAGE_URL.test(icon) && !imageFailed) {
    content = (
      <img
        src={icon}
        alt=""
        className="size-full object-cover"
        onError={() => setImageFailed(true)}
      />
    )
  } else if (typeof icon === "string" && icon && !IMAGE_URL.test(icon)) {
    content = Array.from(icon).slice(0, 2).join("")
  } else if (icon && typeof icon !== "string") {
    content = icon
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-medium [&_svg:not([class*='size-'])]:size-4",
        tone,
        className
      )}
      style={colour && !isHue(colour) ? { background: colour } : undefined}
    >
      {content}
    </span>
  )
}
