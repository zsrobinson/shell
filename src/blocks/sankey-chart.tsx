import { useLayoutEffect, useMemo, useState, type ReactNode } from "react"
import {
  Sankey,
  type SankeyLinkProps as LinkProps,
  type SankeyNodeProps as NodeProps,
} from "recharts"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart"
import { cn } from "../lib/utils"
import {
  prepareSankey,
  sankeyLayout,
  SANKEY_NAME_SIZE,
  SANKEY_VALUE_SIZE,
  type SankeyLinkDatum,
  type SankeyLinkInput,
  type SankeyNodeDatum,
  type SankeyNodeInput,
} from "../lib/sankey"
import { chartNumber } from "./chart-card"

export type {
  SankeyLinkInput as SankeyLink,
  SankeyNodeInput as SankeyNode,
} from "../lib/sankey"

const NODE_WIDTH = 8
// Room for a one-line label beside even the smallest node.
const NODE_PADDING = 24
const MARGIN_Y = 12
const LINK_OPACITY = 0.28
const LINK_ACTIVE = 0.55
const LINK_MUTED = 0.08

// A halo in the card colour keeps labels legible where they cross links.
const HALO = {
  stroke: "var(--card)",
  strokeWidth: 3,
  strokeLinejoin: "round",
  paintOrder: "stroke",
} as const

// The tooltip anchors beside the hovered element, on the side facing the
// chart's middle; Recharts' own anchor ignores the column centring.
type Anchor = { x: number; y: number; flip: boolean }
type Hover = ({ node: string } | { link: number }) & { anchor: Anchor }
// Recharts spreads our datum into its own node and link payloads.
type NodePayload = SankeyNodeDatum & { depth: number }
type LinkPayload = SankeyLinkDatum & {
  source: NodePayload
  target: NodePayload
}

/**
 * Flows between nodes, such as income through a budget into groups and
 * categories. Columns follow the links (sources left, sinks right), nodes keep
 * a stable order by their parents and value, and the chart scrolls inside its
 * container rather than squeezing labels when the width is too small.
 */
export function SankeyChart({
  nodes,
  links,
  label,
  formatValue = chartNumber,
  height,
  className,
  onNodeClick,
  loading,
  compact = false,
}: {
  nodes: SankeyNodeInput[]
  links: SankeyLinkInput[]
  /** Accessible name for the chart. */
  label: string
  formatValue?: (value: number) => string
  /** Pixel height; by default it grows with the busiest column. */
  height?: number
  /** Classes for the scrolling wrapper. */
  className?: string
  onNodeClick?: (node: SankeyNodeInput) => void
  loading?: boolean
  /**
   * For narrow containers such as a phone: names truncate (the full name is
   * the label's title) and values sit on a second line.
   */
  compact?: boolean
}) {
  const data = useMemo(() => prepareSankey(nodes, links), [nodes, links])
  const [hover, setHover] = useState<Hover | null>(null)
  const busiest = Math.max(
    0,
    ...Array.from(
      { length: data.columns },
      (_, c) => data.nodes.filter((n) => n.column === c).length
    )
  )
  const total =
    height ?? Math.min(760, Math.max(240, busiest * NODE_PADDING + 240))
  // Middle columns label above their nodes; leave room at the top.
  const top = data.columns > 2 ? MARGIN_Y + 22 : MARGIN_Y
  const layout = useMemo(
    () =>
      sankeyLayout(data, {
        height: total - top - MARGIN_Y,
        nodePadding: NODE_PADDING,
        nodeWidth: NODE_WIDTH,
        format: formatValue,
        maxNameChars: compact ? 16 : undefined,
      }),
    [data, total, top, formatValue, compact]
  )

  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const edges = useScrollEdges(scroller)

  if (loading || !data.links.length)
    return (
      <div
        role="status"
        className="flex h-44 items-center justify-center text-sm text-muted-foreground"
      >
        {loading ? "Loading…" : "Nothing to show"}
      </div>
    )

  const last = data.columns - 1
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const linkActive = (l: LinkPayload, index: number) =>
    hover === null
      ? null
      : "link" in hover
        ? hover.link === index
        : l.source.id === hover.node || l.target.id === hover.node

  const renderNode = ({ x, y, width, height, payload }: NodeProps) => {
    const node = payload as unknown as NodePayload
    const top = y + (layout.offsets[node.depth] ?? 0)
    const i = data.nodes.findIndex((n) => n.id === node.id)
    const mode = layout.labels[i] ?? "none"
    const outside = node.depth === 0 && last > 0
    // Columns between the outer ones label above the node, clear of ribbons.
    const above = node.depth > 0 && node.depth < last
    const tx = above ? x + width / 2 : outside ? x - 6 : x + width + 6
    const cy = above ? top - 6 : top + height / 2
    const value = formatValue(node.value)
    const name = layout.names[i] ?? node.name
    const input = byId.get(node.id)
    const select = onNodeClick && input ? () => onNodeClick(input) : undefined
    return (
      <g
        data-slot="sankey-node"
        data-id={node.id}
        role={select ? "button" : undefined}
        tabIndex={select ? 0 : undefined}
        aria-label={select ? `${node.name}: ${value}` : undefined}
        onKeyDown={
          select
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  select()
                }
              }
            : undefined
        }
        className={cn(
          "outline-none",
          select &&
            "cursor-pointer [&:focus-visible>rect]:stroke-ring [&:focus-visible>rect]:stroke-2"
        )}
      >
        <rect
          x={x}
          y={top}
          width={width}
          height={Math.max(1, height)}
          rx={2}
          fill={node.color}
        />
        {above ? (
          <text
            x={tx}
            y={cy}
            textAnchor="middle"
            className="pointer-events-none tabular-nums"
            {...HALO}
          >
            {name !== node.name ? <title>{node.name}</title> : null}
            <tspan
              className="fill-foreground font-medium"
              fontSize={SANKEY_NAME_SIZE}
            >
              {name}
            </tspan>
            <tspan
              className="fill-muted-foreground"
              fontSize={SANKEY_VALUE_SIZE}
              dx={6}
            >
              {value}
            </tspan>
          </text>
        ) : mode !== "none" ? (
          <text
            x={tx}
            y={mode === "full" ? cy - 2 : cy}
            textAnchor={outside ? "end" : "start"}
            dominantBaseline={mode === "full" ? "auto" : "central"}
            className="pointer-events-none tabular-nums"
          >
            {name !== node.name ? <title>{node.name}</title> : null}
            <tspan
              className="fill-foreground font-medium"
              fontSize={SANKEY_NAME_SIZE}
            >
              {name}
            </tspan>
            <tspan
              className="fill-muted-foreground"
              fontSize={SANKEY_VALUE_SIZE}
              {...(mode === "full"
                ? { x: tx, dy: SANKEY_VALUE_SIZE + 3 }
                : { dx: 6 })}
            >
              {value}
            </tspan>
          </text>
        ) : null}
      </g>
    )
  }

  const renderLink = ({
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
    payload,
  }: LinkProps) => {
    const l = payload as unknown as LinkPayload
    const sy = sourceY + (layout.offsets[l.source.depth] ?? 0)
    const ty = targetY + (layout.offsets[l.target.depth] ?? 0)
    const active = linkActive(l, index)
    // A filled ribbon between the source's and target's edges, so steep
    // links keep their width instead of a stroke bulging past the nodes.
    const half = Math.max(0.5, linkWidth / 2)
    const d = [
      `M${sourceX},${sy - half}`,
      `C${sourceControlX},${sy - half} ${targetControlX},${ty - half} ${targetX},${ty - half}`,
      `L${targetX},${ty + half}`,
      `C${targetControlX},${ty + half} ${sourceControlX},${sy + half} ${sourceX},${sy + half}`,
      "Z",
    ].join("")
    return (
      <path
        data-slot="sankey-link"
        d={d}
        fill={l.color}
        stroke="none"
        fillOpacity={
          active === null ? LINK_OPACITY : active ? LINK_ACTIVE : LINK_MUTED
        }
        className="transition-[fill-opacity] duration-150"
      />
    )
  }

  return (
    <div
      ref={setScroller}
      data-slot="sankey-chart"
      // Fade an edge that has more chart beyond it.
      style={{
        maskImage:
          edges.start || edges.end
            ? `linear-gradient(to right, ${edges.start ? "transparent, #000 2rem" : "#000"}, ${edges.end ? "#000 calc(100% - 2rem), transparent" : "#000"})`
            : undefined,
      }}
      className={cn(
        "w-full min-w-0 overflow-x-auto overscroll-x-contain",
        className
      )}
    >
      <div style={{ minWidth: layout.minWidth, height: total }}>
        <ChartContainer
          config={{}}
          aria-label={label}
          role="img"
          className="aspect-auto h-full w-full tabular-nums"
        >
          <Sankey
            data={data}
            nameKey="name"
            node={renderNode}
            link={renderLink}
            nodeWidth={NODE_WIDTH}
            nodePadding={NODE_PADDING}
            iterations={0}
            sort={false}
            verticalAlign="top"
            align="justify"
            linkCurvature={0.5}
            margin={{
              top,
              bottom: MARGIN_Y,
              left: layout.margin.left,
              right: layout.margin.right,
            }}
            onMouseEnter={(item, type) => {
              const clampY = (y: number) =>
                Math.min(total - 28, Math.max(top + 16, y))
              if (type === "node") {
                const n = item as NodeProps
                const node = n.payload as unknown as NodePayload
                const flip = node.depth > last / 2
                setHover({
                  node: node.id,
                  anchor: {
                    x: flip ? n.x - 8 : n.x + n.width + 8,
                    y: clampY(
                      n.y + (layout.offsets[node.depth] ?? 0) + n.height / 2
                    ),
                    flip,
                  },
                })
              } else {
                const l = item as LinkProps
                const link = l.payload as unknown as LinkPayload
                const sy = l.sourceY + (layout.offsets[link.source.depth] ?? 0)
                const ty = l.targetY + (layout.offsets[link.target.depth] ?? 0)
                const flip = link.source.depth + link.target.depth > last
                setHover({
                  link: l.index,
                  anchor: {
                    x: (l.sourceX + l.targetX) / 2 + (flip ? -8 : 8),
                    y: clampY((sy + ty) / 2),
                    flip,
                  },
                })
              }
            }}
            onMouseLeave={() => setHover(null)}
            onClick={(item, type) => {
              if (type !== "node" || !onNodeClick) return
              const input = byId.get(
                (item.payload as unknown as NodePayload).id
              )
              if (input) onNodeClick(input)
            }}
          >
            <ChartTooltip
              cursor={false}
              isAnimationActive={false}
              position={hover?.anchor}
              content={
                <ChartTooltipContent
                  hideLabel
                  className={cn(
                    "-translate-y-1/2",
                    hover?.anchor.flip && "-translate-x-full"
                  )}
                  formatter={(value, _name, item) => (
                    <SankeyTooltipRow
                      datum={
                        // Recharts wraps the node or link as `payload`.
                        (item.payload?.payload ?? item.payload) as Partial<
                          NodePayload & LinkPayload
                        >
                      }
                      value={formatValue(Number(value))}
                    />
                  )}
                />
              }
            />
          </Sankey>
        </ChartContainer>
      </div>
      {/* Firefox paints a caption outside a visually hidden table. */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.links.map((l) => (
              <tr key={`${l.source}-${l.target}`}>
                <td>{data.nodes[l.source].name}</td>
                <td>{data.nodes[l.target].name}</td>
                <td>{formatValue(l.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Whether a horizontal scroller has content hidden past either edge. */
function useScrollEdges(element: HTMLElement | null) {
  const [edges, setEdges] = useState({ start: false, end: false })
  useLayoutEffect(() => {
    if (!element) return
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element
      const start = scrollLeft > 1
      const end = scrollLeft + clientWidth < scrollWidth - 1
      setEdges((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end }
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)
    element.addEventListener("scroll", update, { passive: true })
    return () => {
      observer.disconnect()
      element.removeEventListener("scroll", update)
    }
  }, [element])
  return edges
}

function SankeyTooltipRow({
  datum,
  value,
}: {
  datum: Partial<NodePayload & LinkPayload> | undefined
  value: string
}) {
  const link =
    datum &&
    typeof datum.source === "object" &&
    typeof datum.target === "object"
      ? (datum as LinkPayload)
      : undefined
  const name = link
    ? `${link.source.name} → ${link.target.name}`
    : (datum?.name ?? "")
  const share =
    link && link.source.value > 0
      ? Math.round((link.value / link.source.value) * 100)
      : undefined
  return (
    <div className="flex w-full items-start gap-2">
      <span
        aria-hidden
        className="mt-0.5 size-2.5 shrink-0 rounded-[2px]"
        style={{ background: datum?.color }}
      />
      <div className="grid flex-1 gap-1">
        <div className="flex justify-between gap-4 leading-none">
          <span className="text-muted-foreground">{name}</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {value}
          </span>
        </div>
        {link && share !== undefined && (
          <span className="leading-none text-muted-foreground">
            {share}% of {link.source.name}
          </span>
        )}
      </div>
    </div>
  )
}

/** `SankeyChart` in a card: title, optional header value or action, and footer. */
export function SankeyChartCard({
  title,
  value,
  action,
  footer,
  ...props
}: React.ComponentProps<typeof SankeyChart> & {
  title: string
  /** A headline figure beside the title, such as total income. */
  value?: ReactNode
  action?: ReactNode
  /** Summary lines under the chart, such as the savings rate. */
  footer?: ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {value != null && (
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
        )}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="px-0">
        <SankeyChart
          {...props}
          className={cn("px-(--card-spacing)", props.className)}
        />
      </CardContent>
      {footer && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
