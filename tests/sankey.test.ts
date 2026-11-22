import { test } from "node:test"
import assert from "node:assert/strict"
import {
  prepareSankey,
  sankeyLayout,
  SANKEY_NEUTRAL,
  type SankeyLinkInput,
  type SankeyNodeInput,
} from "../src/lib/sankey"

// Income → Budget → groups → categories, with Saved straight from the hub.
const nodes: SankeyNodeInput[] = [
  { id: "food", label: "Food", color: "var(--chart-3)" },
  { id: "salary", label: "Salary", color: "var(--chart-positive)" },
  { id: "budget", label: "Budget" },
  { id: "saved", label: "Saved", color: "var(--chart-positive)" },
  { id: "home", label: "Home", color: "var(--chart-2)" },
  { id: "side", label: "Side work", color: "var(--chart-positive)" },
  { id: "rent", label: "Rent" },
  { id: "groceries", label: "Groceries" },
  { id: "dining", label: "Dining" },
  { id: "utilities", label: "Utilities" },
  { id: "unused", label: "Unused" },
]
const links: SankeyLinkInput[] = [
  { source: "salary", target: "budget", value: 5000 },
  { source: "side", target: "budget", value: 800 },
  { source: "budget", target: "home", value: 2300 },
  { source: "budget", target: "food", value: 900 },
  { source: "budget", target: "saved", value: 2600 },
  { source: "food", target: "dining", value: 300 },
  { source: "food", target: "groceries", value: 600 },
  { source: "home", target: "utilities", value: 300 },
  { source: "home", target: "rent", value: 2000 },
]

const order = (p: ReturnType<typeof prepareSankey>) =>
  p.nodes.map((n) => `${n.column}:${n.id}`)

test("columns follow the links and sinks align right", () => {
  const p = prepareSankey(nodes, links)
  assert.equal(p.columns, 4)
  assert.deepEqual(order(p), [
    "0:salary",
    "0:side",
    "1:budget",
    "2:home",
    "2:food",
    // Children follow their parent's order, larger first; Saved, reached from
    // the hub further left, comes after them.
    "3:rent",
    "3:utilities",
    "3:groceries",
    "3:dining",
    "3:saved",
  ])
  const budget = p.nodes.find((n) => n.id === "budget")!
  assert.equal(budget.value, 5800)
  assert.equal(budget.color, SANKEY_NEUTRAL)
})

test("order is independent of input order", () => {
  const a = prepareSankey(nodes, links)
  const b = prepareSankey([...nodes].reverse(), [...links].reverse())
  assert.deepEqual(order(a), order(b))
  assert.deepEqual(a.links, b.links)
})

test("links index the ordered nodes and take the source colour, else the target's", () => {
  const p = prepareSankey(nodes, links)
  const name = (i: number) => p.nodes[i].id
  const find = (s: string, t: string) =>
    p.links.find((l) => name(l.source) === s && name(l.target) === t)!
  assert.equal(find("salary", "budget").color, "var(--chart-positive)")
  // The hub is uncoloured, so its links take the group's colour.
  assert.equal(find("budget", "home").color, "var(--chart-2)")
  assert.equal(find("food", "groceries").color, "var(--chart-3)")
  assert.equal(find("budget", "food").value, 900)
})

test("bad links are dropped and duplicate pairs summed", () => {
  const p = prepareSankey(
    [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ],
    [
      { source: "a", target: "b", value: 2 },
      { source: "a", target: "b", value: 3 },
      { source: "b", target: "a", value: 1 }, // cycle
      { source: "a", target: "a", value: 1 }, // self
      { source: "a", target: "missing", value: 1 },
      { source: "a", target: "c", value: 0 },
      { source: "a", target: "c", value: Number.NaN },
    ]
  )
  assert.deepEqual(
    p.nodes.map((n) => n.id),
    ["a", "b"]
  )
  assert.deepEqual(
    p.links.map((l) => l.value),
    [5]
  )
  assert.equal(prepareSankey([], []).columns, 0)
})

test("layout centres columns and reserves label room", () => {
  const p = prepareSankey(nodes, links)
  const l = sankeyLayout(p, {
    height: 400,
    nodePadding: 12,
    nodeWidth: 8,
    format: (v) => `$${v}`,
  })
  // The busiest column (five nodes) sets the scale and fills the height.
  assert.equal(l.scale, (400 - 4 * 12) / 5800)
  assert.equal(l.offsets[3], 0)
  // The hub's single node is centred: no padding to account for.
  assert.equal(l.offsets[1], (400 - 5800 * l.scale) / 2)
  // Saved skips the group column, so its flow is centred along with the
  // groups and runs below them instead of through them.
  assert.equal(l.offsets[2], (400 - (3200 + 2600) * l.scale - 2 * 12) / 2)
  assert.ok(l.margin.left > 0 && l.margin.right > 0)
  assert.ok(l.minWidth > l.margin.left + l.margin.right + 3 * 72)
  // With room, every label shows name and value.
  assert.ok(l.labels.every((m) => m === "full"))
  // When crowded, every node keeps a one-line label before any takes two;
  // when even that overlaps, smaller nodes give way.
  const mode = (layout: typeof l, id: string) =>
    layout.labels[p.nodes.findIndex((n) => n.id === id)]
  const tight = sankeyLayout(p, {
    height: 200,
    nodePadding: 12,
    nodeWidth: 8,
    format: (v) => `$${v}`,
  })
  assert.equal(mode(tight, "rent"), "full")
  assert.equal(mode(tight, "saved"), "full")
  for (const id of ["utilities", "groceries", "dining"])
    assert.equal(mode(tight, id), "inline")
  const tiny = sankeyLayout(p, {
    height: 120,
    nodePadding: 4,
    nodeWidth: 8,
    format: String,
  })
  assert.equal(mode(tiny, "food"), "inline")
  assert.equal(mode(tiny, "home"), "full")
  assert.equal(mode(tiny, "dining"), "none")
})
