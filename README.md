# shell

The shared frame and building blocks for small internal web apps: official
shadcn/ui Rhea components (Base UI, `base-rhea`, pointer cursors), Flexoki,
Geist, an app switcher, theme menu and signed-in account controls.

## New app

Copy `starter/` to a new repository and rename `example-panel` in `package.json`,
`Example` in `src/routes/__root.tsx`, and the HTML title. Run:

```sh
npm run shell:update
npm ci
npm run build
npm run dev
```

The update command replaces the starter's repository-local `file:..` dependency
with a full commit pin from shell main and refreshes `package-lock.json`. Commit
both files. The copied app and its Docker build then work independently.

The starter uses Vite, React 19, TypeScript, Tailwind v4, TanStack Router file
routes, TanStack Query, and Hono on Node. `/` lists items, `/items/example` is a
detail page, and `/components` exercises every UI module and shared block in
light and dark. The app frame exercises sidebar, app switcher, theme controls,
and the shared toast provider. Confirmations, menus, tooltips and sheets are
interactive. Keep longer workflows on real pages.

Configure the server with `ACCESS_ISSUER`, `ACCESS_AUD`, `PUBLIC_ORIGIN`,
`SERVICE_MANIFEST` (path to a JSON array of `{ name, url, icon?, colour? }`),
`PORT`, and optionally `BIND_ADDRESS` and `METRICS_TOKEN`. Keep credentials and
the service manifest outside the public repository. Run `npm start`, or build
the included Dockerfile after pinning shell. Vite proxies `/api` to port 8787;
the development API still requires a valid Access assertion.

New app checklist:

- Pick `data-hue` on `<html>`: `re`, `or`, `ye`, `gr`, `cy`, `bl`, `pu`, or `ma`.
- Add the hostname to the tunnel and Cloudflare Access.
- Add the app to the services manifest in the deployment repository.
- Add a private Prometheus scrape and a Healthchecks entry.
- Build, deploy, and check a list, a detail page, and an action.

## Export surface

| Import                                | Contents                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@zsrobinson/shell`                   | AppShell, CommandPalette, CommandSearch, AppIcon, Page, PageHeader, PageTitle, PageMeta, PageActions, PageGrid, PageStack, SectionGroup, AppNavigation, theme hooks, toast, app types |
| `@zsrobinson/shell/styles.css`        | Tailwind v4, Flexoki tokens, Geist, radii, Rhea variants and the standard Tailwind type scale                                                                                         |
| `@zsrobinson/shell/ui/*`              | Official Rhea primitives: button, card, sidebar, table, field, dialog, checkbox, popover, calendar, combobox, and the other UI modules                                                |
| `@zsrobinson/shell/blocks/*`          | confirm-action, copy-button, detail-list, list-row, query-error, file-drop, upload-progress, page-states, date-picker, filter-bar, stat, status-timeline, chart-card, sankey-chart    |
| `@zsrobinson/shell/lib/api`           | ApiError, parseJson, getJson, errorMessage                                                                                                                                            |
| `@zsrobinson/shell/lib/format`        | Bytes/MiB, duration, relative/absolute time, percent, count, pluralize, parseTime                                                                                                     |
| `@zsrobinson/shell/lib/calendar-date` | Local YYYY-MM-DD dates: parse, format, ranges, end of day, viewer time zone                                                                                                           |
| `@zsrobinson/shell/lib/sankey`        | prepareSankey and sankeyLayout: the Sankey block's ordering, colours and label room                                                                                                   |
| `@zsrobinson/shell/lib/use-upload`    | Progress, mutation notifications and upload limit; app supplies transport and cache refresh                                                                                           |
| `@zsrobinson/shell/hooks/use-mobile`  | Mobile breakpoint hook                                                                                                                                                                |
| `@zsrobinson/shell/server`            | createShellServer, mountStatic, serve, ServerOptions, ShellEnv, RequestMetadata                                                                                                       |

Import the stylesheet once; the starter's own CSS is only the import and an
`@source` directive. All theme decisions belong in shell, not app CSS. Pair `font-mono` with `text-xs` or `text-sm`. Supply data and app navigation to AppShell (`searchPlaceholder` names what the command palette finds); it has
no hostname or service inventory built in. QueryError accepts any error and
never imports an app's API module. NotFound accepts an optional `homeLabel`.

The UI components were generated with
`shadcn init --preset b27GcrRo --template vite --pointer`, then `shadcn add`.
Their imports are relative, centered dialogs have transparent overlays, Sonner
uses the shared theme, and use-mobile reads its media query synchronously.
`src/shadcn-tailwind.css` and `src/flexoki.css` retain their upstream contents.

## Server boundary

`createShellServer(options)` returns a Hono app. Register app API routes, then
call `mountStatic(app)` last and `serve({ fetch: app.fetch, ... })`. Hono,
`@hono/node-server` and jose are peer dependencies. React Query is a peer for
the upload hook; neither the frame nor the server requires a router.

The server validates Access JWT signatures, issuer, audience and email, rejects
mutating requests from a different Origin, and serves `{ email, services }` at
`GET /api/session`. Hashed `dist/assets` files have immutable one-year caching;
HTML and navigation fallbacks use `no-cache`. Responses retain nosniff, same-origin
referrers and a self-only Content Security Policy. The starter sets
`allowSameOriginFrames` for its embedded component gallery; other apps default
to `frame-ancestors 'none'`. Unexpected errors return generic
JSON without printing exception messages.

Every request emits one JSON line containing only method, registered route
pattern, status and durationMs. A `log` callback can forward that same metadata
to an existing Loki exporter. No bodies, emails, query strings, concrete IDs,
headers or exception content are recorded. Unknown HTTP methods are grouped
as OTHER. `/metrics` is opt-in via `metrics.authorize(request)`; use a private
network and a separate scrape credential, never an application login bypass.
The endpoint exposes `shell_http_requests_total` and the histogram
`shell_http_request_duration_seconds`, labelled by method, route pattern and
status. Metrics requests do not count themselves. App domain metrics remain
owned by the app.

## Update loop

1. Change shell, run checks, inspect `/components`, and push/merge shell.
2. In each app run `npm run shell:update` to resolve the latest shell **main
   commit**, pin it, and refresh its lockfile.
3. Review the dependency diff; run the app's checks and build, inspect its pages,
   then commit and deploy the app.

A pushed style change never ships to an app until that app's pin is reviewed
and deployed. Add the same `scripts/shell-update.mjs` and `shell:update` command
to existing consumers. No floating branch dependencies are used.

## Developing shell

```sh
npm ci
npm run check
npm test
npm ci --prefix starter
npm run build --prefix starter
npm run dev --prefix starter
```

The in-repository starter installs a packed local copy of shell (`install-links`
in its `.npmrc`) so React and its types are shared with the app. After editing
shell, refresh that copy with `npm ci --prefix starter`. CI checks types, lint,
formatting, tests, CSS generation, and the starter build.

## Layout and navigation

AppShell accepts `navGroups`: items provide router links, labels, icons, active
state, status, player/count badges and registered actions. Only the active
entity expands. Rail tiles open page flyouts, and the active entity's page icons
remain below a separator. Item `onSelect` callbacks power the shared command
palette; destructive actions should open an app-owned confirmation.

`entityBar` supplies the active entity, its status and page. Shell renders a
sticky 48px bar, desktop entity actions, a phone page menu and compact action
menu. The phone sheet switches entities and apps. The existing `nav` slot and
`breadcrumbs` remain available for apps without entities.

Page owns `p-4 md:p-6`, `gap-4`, a left-anchored max-w-5xl column and text-xl
page titles. Rhea cards keep their generated 20px spacing; only nested cards
use size=sm. PageGrid defaults to one column; two columns are for comparable
content. Page viewport reserves the space below the sticky 48px entity bar for
applications such as a console, with scrolling owned by its inner pane. SectionGroup now behaves as PageStack so unrelated topics retain
separate surfaces. Detail rows are 36px on desktop and 44px below sm.

The UI files are generated Base UI Rhea components. Adaptations are relative
imports, the local clsx/tailwind-merge helper, pointer cursors on interactive
items, transparent dialog overlays, the shared Sonner theme and synchronous
use-mobile. Flexoki, Geist, the radius scale and data-hue remain centralized.

Use `Page viewport` for workspaces such as a console: it fills the space below the sticky 48px entity bar. Its content must use `min-h-0` and scroll internally; ordinary pages retain the shared 5xl content column.

Use `FormStack` inside `Page` for form topics: it keeps the shared left edge and caps fields at 3xl, while lists and overview grids use the full content width.

## Filters, figures and status

`blocks/filter-bar` holds the list-page filter row: `FilterBar` wraps controls,
`MultiSelect` picks several values from a searchable grouped list (none chosen
means all), and `FilterChips` shows active filters as removable chips with a
Clear all. Keep filter state in the router's search params so views link and
Back works.

`blocks/date-picker` gives `DatePicker` (one date in a popover calendar, with
optional presets such as "30 days" or "No end", and `disabled` days) and
`DateRangePicker` (relative presets that stay relative in links, plus a custom
inclusive range with Apply). Values are local `YYYY-MM-DD` calendar dates from
`lib/calendar-date`; never parse them with `Date.parse`, which reads them as UTC.
Send `endOfCalendarDay(date)` when an expiry means the end of the viewer's day.

`blocks/stat` gives `Stat` and `StatRow` for a card's figures and `StatDelta`
for the change against the previous period of the same length. `better` says
which direction is good (`"down"` for errors), so the tone is meaningful.

`blocks/status-timeline` draws status-page bars, oldest first, one per period:
`ok`, `degraded`, `down` or `unknown`, with a tooltip each and a summary as the
accessible name. `StatusLegend` is its key.

Nav items accept `keywords`, extra words the command palette matches (an id, for
example); hidden nav groups still feed the palette.

AppShell's `search` adds palette results that depend on the typed query, such as records from an
API: `{ onQueryChange(query), groups, loading? }`. The palette calls
`onQueryChange` on each keystroke and with `""` when it closes; debounce and
fetch in the app, then pass the results back as `NavGroup`s. They appear after
the filtered pages exactly as given (cmdk does not filter them again), a
search item's `badge` shows at the row's end, and `loading` adds a Searching
row. Without `search` the palette behaves as before.

```tsx
<AppShell
  navGroups={navGroups}
  search={{
    onQueryChange: setQuery,
    loading: results.isFetching,
    groups: [{ id: "transactions", label: "Transactions", items: rows }],
  }}
/>
```

## Combobox

`ui/combobox` is the official base-rhea Combobox (Base UI). Adaptations are
lucide icons, pointer cursors, an `inset` prop on `ComboboxItem` to indent a
child item, and `ComboboxSelectTrigger`, a trigger for a combobox whose search
input sits in the popup. Its `variant="field"` (default) matches
`SelectTrigger`; pass `className="w-full"` in a form. `variant="chip"` is a
compact pill for an inline picker, such as a category in a table row; give
its `ComboboxContent` a `min-w-60`. Both take `size="sm"`. Pass grouped
`items` (`{ value: label, items }[]`) to `Combobox` and render
`ComboboxGroup`/`ComboboxLabel`/`ComboboxCollection` inside `ComboboxList`;
see `starter/src/combobox-gallery.tsx`.

```tsx
<Combobox
  items={groups}
  value={category}
  onValueChange={setCategory}
  itemToStringLabel={(c) => c.label}
>
  <ComboboxSelectTrigger variant="chip" size="sm" aria-label="Category">
    <ComboboxValue placeholder="Uncategorized" />
  </ComboboxSelectTrigger>
  <ComboboxContent className="min-w-60">
    <ComboboxInput showTrigger={false} placeholder="Search categories" />
    <ComboboxEmpty>No categories found</ComboboxEmpty>
    <ComboboxList>
      {(group) => (
        <ComboboxGroup key={group.value} items={group.items}>
          <ComboboxLabel>{group.value}</ComboboxLabel>
          <ComboboxCollection>
            {(c) => (
              <ComboboxItem key={c.value} value={c} inset={c.child}>
                {c.label}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxGroup>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

## Charts

`ui/chart` is the official base-rhea Recharts component: `ChartContainer`,
`ChartTooltip`/`ChartTooltipContent`, and `ChartLegend`/`ChartLegendContent`.
`blocks/chart-card` supplies `ChartCard` (area), `BarChartCard`, `StatChartCard`
(sparkline), `TrendChart`, and `ChartRangeSelect` (1h, 24h, 7d, 30d).
Supply epoch milliseconds in `time`, numeric series keys, and a `ChartConfig` mapping
those keys to labels and colors. Use `var(--chart-1)` through `var(--chart-5)`;
the first follows the app accent and the rest use categorical Flexoki colors.
Keep a series' key and color consistent across pages. Supply a descriptive
`label` for accessibility and `format` for units. Cards include loading and empty
states, tabular numbers, keyboard accessible charts and tooltips; single series
charts omit the legend. `value` keeps a current reading alongside a card title.

Every chart measures itself and picks its own axes: value ticks on round steps
(1, 2, 2.5 or 5 × 10ⁿ) over a domain that hugs the data, and time ticks on even
calendar steps (hours; the 1st, 8th, 15th, 22nd and 29th; month starts; years)
that fit the width, with labels that would clip at the edge dropped. Bars show
evenly spaced categories ending at the latest. Pass `utc` when times are
calendar dates at UTC midnight. `timeTicks` sets exact ticks for a `time` that
is not a timestamp, such as day of month. The helpers live in `lib/chart-ticks`.

`formatTick` and `formatTimeTick` give the axes rounder labels than the
tooltip (for example `$105k` and month names), `curve="linear"` draws straight
segments that never overshoot, `references` adds labelled dashed lines (`side: "axis"` labels them in the
value-axis gutter, clear of bars) such as a
budget or target (`side: "left"` moves the label clear of a line's end),
`markers` labels a time (a vertical line on an area chart, a shaded bar such as
a month in progress on a bar chart), and `dashed` draws listed series as dashed
lines without fill, such as a projection. Legends follow series order, which is
also the stack order; `legend` names a single series too. `TrendChart` and the cards take `stacked` (bars stack by sign, so negative
series grow below a zero line), `formatTime` for ticks and tooltip headings,
and `className` for the chart height. `integer` keeps value ticks on whole steps for counts. `baseline="data"` fits an area chart's
value axis to its series instead of zero, for balances and other levels where
change matters more than size; bars and stacks always start at zero. Donut
legends sit beside the ring only when the card is wide enough, otherwise below. `DonutChart`/`DonutChartCard` show a
part-to-whole with the total in the centre and a legend with values and shares;
beyond `max` slices (default five) the rest folds into a neutral Other, and
`onSelect` turns legend rows into buttons.

`blocks/sankey-chart` supplies `SankeyChart` and `SankeyChartCard` (title,
optional `value`, `action` and `footer`) for flows such as income through a
budget into groups and categories. Pass `nodes` (`{ id, label, color? }`),
`links` (`{ source, target, value }` by id), `label` and `formatValue`;
`height` defaults to a size that gives every node room for a label, and
`onNodeClick` makes nodes buttons. Columns follow the links: sources at the
left, sinks (such as Saved) at the right. Nodes keep their parents' order, then
larger first, so the layout is stable. A link takes its source's colour, else
its target's; leave a hub uncoloured so its links take each group's colour.
Labels show name and value beside nodes; crowded small nodes fall back to one
line, then to the tooltip. Where labels would not fit (phones), the chart
scrolls sideways inside its card with a faded edge; the page never does.

Sign is not identity: use `var(--chart-positive)` and `var(--chart-negative)`
for inflow and outflow or gain and loss, and `var(--chart-neutral)` for a
baseline or Other. The mark steps are validated to stay apart under red-green
colour blindness; always pair them with position or a signed label. Text uses
`text-positive` and `text-negative`.

Vite apps must add `"recharts"` to `optimizeDeps.include` (as the starter does),
because shell ships source and excludes itself from prebundling. This bundles
Recharts' CommonJS selector dependencies correctly in development. Keep existing
`use-sync-external-store/shim` entries. See `/components` for chart examples.

`ChartRangeSelect` also accepts a caller-supplied `ranges` array of
`{ value, label, duration }`, where duration is seconds or `"all"`. Its value and
change callback infer the caller's string union; the default remains 1h/24h/7d/30d.
For calendar ranges such as YTD, compute duration from the chosen start date in
the consuming app. For example:

```tsx
<ChartRangeSelect
  value={range}
  onChange={setRange}
  ranges={[
    { value: "1M", label: "1 month", duration: 30 * 86400 },
    { value: "All", label: "All", duration: "all" },
  ]}
/>
```

Chart timestamps and `formatTime` arguments are epoch-millisecond numbers.
Convert Prometheus seconds once at the server boundary; pass `Date.parse(iso)`
for ISO backup timestamps without dividing by 1000. Custom formatters should use
`Intl.DateTimeFormat(...).format(time)`. Date strings and Date objects are not
chart keys. Tooltip time comes from `payload[].payload.time`, never the series
label supplied to shadcn's label callback.
