/**
 * Data preparation and layout arithmetic for the Sankey chart block. Recharts
 * places nodes; these helpers decide their order and columns deterministically
 * and size the room the labels need, so the block never measures text.
 */

export type SankeyNodeInput = {
  id: string
  label: string
  /** Any CSS colour, such as `var(--chart-2)`. Uncoloured nodes are neutral. */
  color?: string
}
export type SankeyLinkInput = { source: string; target: string; value: number }

export type SankeyNodeDatum = {
  id: string
  /** Recharts reads `name` for tooltips. */
  name: string
  color: string
  /** Larger of the node's inflow and outflow. */
  value: number
  column: number
}
export type SankeyLinkDatum = {
  source: number
  target: number
  value: number
  color: string
}
export type PreparedSankey = {
  nodes: SankeyNodeDatum[]
  links: SankeyLinkDatum[]
  columns: number
}

export const SANKEY_NEUTRAL = "var(--chart-neutral)"

/**
 * Validates, orders and colours a Sankey's nodes and links.
 *
 * - Links to unknown nodes, self links, non-positive values and links that
 *   would close a cycle are dropped; duplicate pairs are summed. Nodes without
 *   any remaining link are dropped.
 * - Columns follow the links: sources at the left, sinks at the right, every
 *   other node one column after its furthest source (Recharts' `justify`).
 * - Within a column, nodes follow their largest parent's order, so links do not
 *   cross; nodes reached from further left (such as Saved, straight from a
 *   hub) come after, then larger values first, then label.
 * - A link takes its source's colour, else its target's, else neutral.
 */
export function prepareSankey(
  nodes: SankeyNodeInput[],
  links: SankeyLinkInput[]
): PreparedSankey {
  const known = new Map(nodes.map((n) => [n.id, n]))
  const pairs = new Map<string, SankeyLinkInput>()
  const out = new Map<string, Set<string>>()
  const reaches = (from: string, to: string): boolean => {
    const seen = new Set<string>()
    const stack = [from]
    while (stack.length) {
      const id = stack.pop()!
      if (id === to) return true
      if (seen.has(id)) continue
      seen.add(id)
      for (const next of out.get(id) ?? []) stack.push(next)
    }
    return false
  }
  for (const l of links) {
    if (!known.has(l.source) || !known.has(l.target)) continue
    if (l.source === l.target || !(l.value > 0) || !Number.isFinite(l.value))
      continue
    const key = `${l.source}\u0000${l.target}`
    const existing = pairs.get(key)
    if (existing) {
      existing.value += l.value
      continue
    }
    if (reaches(l.target, l.source)) continue
    pairs.set(key, { ...l })
    if (!out.has(l.source)) out.set(l.source, new Set())
    out.get(l.source)!.add(l.target)
  }
  const kept = [...pairs.values()]
  const used = nodes.filter((n) =>
    kept.some((l) => l.source === n.id || l.target === n.id)
  )

  const inflow = new Map<string, number>()
  const outflow = new Map<string, number>()
  const parents = new Map<string, SankeyLinkInput[]>()
  for (const l of kept) {
    outflow.set(l.source, (outflow.get(l.source) ?? 0) + l.value)
    inflow.set(l.target, (inflow.get(l.target) ?? 0) + l.value)
    parents.set(l.target, [...(parents.get(l.target) ?? []), l])
  }
  const value = (id: string) =>
    Math.max(inflow.get(id) ?? 0, outflow.get(id) ?? 0)

  // Longest path from a source; the graph is acyclic by construction.
  const depth = new Map<string, number>()
  const depthOf = (id: string): number => {
    const cached = depth.get(id)
    if (cached !== undefined) return cached
    const d = Math.max(
      0,
      ...(parents.get(id) ?? []).map((l) => depthOf(l.source) + 1)
    )
    depth.set(id, d)
    return d
  }
  const maxDepth = Math.max(0, ...used.map((n) => depthOf(n.id)))
  const column = (id: string) =>
    maxDepth >= 1 && !out.get(id)?.size ? maxDepth : depthOf(id)

  // Order column by column so each parent's rank is known before its children.
  const rank = new Map<string, number>()
  const byColumn: SankeyNodeInput[][] = []
  for (const n of used) (byColumn[column(n.id)] ??= []).push(n)
  for (let c = 0; c < byColumn.length; c++) {
    const col = byColumn[c] ?? []
    const key = (n: SankeyNodeInput) => {
      const main = [...(parents.get(n.id) ?? [])].sort(
        (a, b) =>
          b.value - a.value ||
          (rank.get(a.source) ?? 0) - (rank.get(b.source) ?? 0)
      )[0]
      if (!main) return [0, 0]
      return [c - column(main.source), rank.get(main.source) ?? 0]
    }
    col.sort((a, b) => {
      const ka = key(a)
      const kb = key(b)
      for (let i = 0; i < ka.length; i++)
        if (ka[i] !== kb[i]) return ka[i] - kb[i]
      return value(b.id) - value(a.id) || a.label.localeCompare(b.label)
    })
    col.forEach((n, i) => rank.set(n.id, i))
  }

  const ordered = byColumn.flatMap((col) => col ?? [])
  const index = new Map(ordered.map((n, i) => [n.id, i]))
  return {
    nodes: ordered.map((n) => ({
      id: n.id,
      name: n.label,
      color: n.color ?? SANKEY_NEUTRAL,
      value: value(n.id),
      column: column(n.id),
    })),
    links: kept
      .map((l) => ({
        source: index.get(l.source)!,
        target: index.get(l.target)!,
        value: l.value,
        color:
          known.get(l.source)!.color ??
          known.get(l.target)!.color ??
          SANKEY_NEUTRAL,
      }))
      .sort((a, b) => a.source - b.source || a.target - b.target),
    columns: ordered.length ? maxDepth + 1 : 0,
  }
}

/** How much of a node's label fits beside it. */
export type SankeyLabelMode = "full" | "inline" | "none"

export type SankeyLayout = {
  /** Pixels per unit of value, as Recharts computes it. */
  scale: number
  /** Downward shift per column that centres it vertically. */
  offsets: number[]
  labels: SankeyLabelMode[]
  /** Room reserved beside the outer columns for their labels. */
  margin: { left: number; right: number }
  /** Narrowest width at which every label fits; scroll below it. */
  minWidth: number
}

export const SANKEY_NAME_SIZE = 12
export const SANKEY_VALUE_SIZE = 11
const LABEL_GAP = 6
/**
 * Half the drawn height of a label around its node's centre: the name's and
 * value's line boxes with the value 14px below the name, measured in
 * Firefox, whose boxes include the halo and run taller than Chromium's.
 */
const LABEL_HALF_HEIGHT = { full: 17, inline: 11 }
/** How far a label may run into the chart's top and bottom margin. */
const LABEL_BLEED = 10
const MIN_COLUMN_GAP = 72

/** A conservative estimate of a Geist label's width at `size` pixels. */
export const sankeyTextWidth = (text: string, size: number) =>
  Math.ceil(text.length * size * 0.6) + 2

/**
 * Column offsets, label modes and the margins the labels need, for a plot
 * area of `height` pixels. Labels sit outside the first and last columns and
 * to the right of nodes in between. As many labels as fit show name and
 * value on one line, larger nodes first; those with room above and below then
 * take two lines. A label that would overlap another is left to the tooltip.
 */
export function sankeyLayout(
  data: PreparedSankey,
  {
    height,
    nodePadding,
    nodeWidth,
    format,
  }: {
    height: number
    nodePadding: number
    nodeWidth: number
    format: (value: number) => string
  }
): SankeyLayout {
  const cols = Array.from({ length: data.columns }, (_, c) =>
    data.nodes.filter((n) => n.column === c)
  )
  const scale = Math.max(
    0,
    Math.min(
      ...cols
        .filter((col) => col.length)
        .map(
          (col) =>
            (height - (col.length - 1) * nodePadding) /
            col.reduce((s, n) => s + n.value, 0)
        )
    )
  )
  // Links that skip a column (such as Saved, straight from a hub) run below
  // its nodes, so centre the nodes together with the flow passing under them.
  const passing = cols.map(() => 0)
  for (const l of data.links) {
    const from = data.nodes[l.source].column
    const to = data.nodes[l.target].column
    for (let c = from + 1; c < to; c++) passing[c] += l.value
  }
  const offsets = cols.map((col, c) => {
    if (!col.length) return 0
    const gaps = col.length - 1 + (passing[c] ? 1 : 0)
    const used =
      (col.reduce((s, n) => s + n.value, 0) + passing[c]) * scale +
      gaps * nodePadding
    return Math.max(0, (height - used) / 2)
  })
  // Place labels column by column, largest nodes first.
  const labels: SankeyLabelMode[] = data.nodes.map(() => "none")
  const centres: number[] = []
  const tops = cols.map((_, c) => offsets[c])
  data.nodes.forEach((n, i) => {
    const h = n.value * scale
    centres[i] = tops[n.column] + h / 2
    tops[n.column] += h + nodePadding
  })
  for (const col of cols) {
    const extent = new Map<number, [number, number]>()
    const fits = (i: number, mode: "full" | "inline") => {
      const top = centres[i] - LABEL_HALF_HEIGHT[mode]
      const bottom = centres[i] + LABEL_HALF_HEIGHT[mode]
      if (top < -LABEL_BLEED || bottom > height + LABEL_BLEED) return null
      for (const [k, [t, b]] of extent)
        if (k !== i && bottom + 1 > t && top < b + 1) return null
      return [top, bottom] as [number, number]
    }
    const order = col
      .map((n) => data.nodes.indexOf(n))
      .sort((a, b) => data.nodes[b].value - data.nodes[a].value || a - b)
    // As many labels as fit on one line, then a second line where there is room.
    for (const mode of ["inline", "full"] as const)
      for (const i of order) {
        if (mode === "full" && labels[i] === "none") continue
        const room = fits(i, mode)
        if (!room) continue
        labels[i] = mode
        extent.set(i, room)
      }
  }
  const widths = data.nodes.map((n, i) => {
    const name = sankeyTextWidth(n.name, SANKEY_NAME_SIZE)
    const value = sankeyTextWidth(format(n.value), SANKEY_VALUE_SIZE)
    if (labels[i] === "full") return Math.max(name, value)
    if (labels[i] === "inline") return name + LABEL_GAP + value
    return 0
  })
  const widest = (c: number) =>
    Math.max(
      0,
      ...data.nodes.flatMap((n, i) => (n.column === c ? widths[i] : []))
    )
  const last = data.columns - 1
  const left = data.columns > 1 ? widest(0) + LABEL_GAP : 0
  const right = widest(last) + (widest(last) ? LABEL_GAP : 0)
  let middle = 0
  for (let c = 1; c < last; c++) middle = Math.max(middle, widest(c))
  const gap = Math.max(MIN_COLUMN_GAP, middle + LABEL_GAP * 3)
  const minWidth =
    left + right + data.columns * nodeWidth + Math.max(0, last) * gap
  return { scale, offsets, labels, margin: { left, right }, minWidth }
}
