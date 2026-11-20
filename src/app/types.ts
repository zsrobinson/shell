/** One entry of the runtime app manifest that feeds the app switcher. */
export type AppLink = {
  name: string
  url: string
  /** An image URL (absolute or root-relative) or one or two characters. */
  icon?: string
  /** A Flexoki hue key (re, or, ye, gr, cy, bl, pu, ma) or any CSS colour. */
  colour?: string
}

export const HUES = ["re", "or", "ye", "gr", "cy", "bl", "pu", "ma"] as const
export type Hue = (typeof HUES)[number]

export function isHue(value: string | undefined): value is Hue {
  return HUES.includes(value as Hue)
}
