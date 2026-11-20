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

| Import                               | Contents                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@zsrobinson/shell`                  | AppShell, AppIcon, Page, PageHeader, PageTitle, PageMeta, PageActions, PageGrid, PageStack, SectionGroup, AppNavigation, theme hooks, toast, app types |
| `@zsrobinson/shell/styles.css`       | Tailwind v4, Flexoki tokens, Geist, radii, Rhea variants and the standard Tailwind type scale                                                          |
| `@zsrobinson/shell/ui/*`             | Official Rhea primitives: button, card, sidebar, table, field, dialog, and the other UI modules                                                        |
| `@zsrobinson/shell/blocks/*`         | confirm-action, copy-button, detail-list, list-row, query-error, file-drop, upload-progress, page-states                                               |
| `@zsrobinson/shell/lib/api`          | ApiError, parseJson, getJson, errorMessage                                                                                                             |
| `@zsrobinson/shell/lib/format`       | Bytes/MiB, duration, relative/absolute time, percent, count, pluralize, parseTime                                                                      |
| `@zsrobinson/shell/lib/use-upload`   | Progress, mutation notifications and upload limit; app supplies transport and cache refresh                                                            |
| `@zsrobinson/shell/hooks/use-mobile` | Mobile breakpoint hook                                                                                                                                 |
| `@zsrobinson/shell/server`           | createShellServer, mountStatic, serve, ServerOptions, ShellEnv, RequestMetadata                                                                        |

Import the stylesheet once; the starter's own CSS is only the import and an
`@source` directive. All theme decisions belong in shell, not app CSS. Pair `font-mono` with `text-xs` or `text-sm`. Supply data and app navigation to AppShell; it has
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

## Charts

`ui/chart` is the official base-rhea Recharts component: `ChartContainer`,
`ChartTooltip`/`ChartTooltipContent`, and `ChartLegend`/`ChartLegendContent`.
`blocks/chart-card` supplies `ChartCard` (area), `BarChartCard`, `StatChartCard`
(sparkline), `TrendChart`, and `ChartRangeSelect` (1h, 24h, 7d, 30d).
Supply epoch seconds in `time`, numeric series keys, and a `ChartConfig` mapping
those keys to labels and colors. Use `var(--chart-1)` through `var(--chart-5)`;
the first follows the app accent and the rest use categorical Flexoki colors.
Keep a series' key and color consistent across pages. Supply a descriptive
`label` for accessibility and `format` for units. Cards include loading and empty
states, tabular numbers, keyboard accessible charts and tooltips; single series
charts omit the legend. `value` keeps a current reading alongside a card title.

`TrendChart` and the cards take `stacked` (bars stack by sign, so negative
series grow below a zero line), `formatTime` for ticks and tooltip headings,
and `className` for the chart height. `DonutChart`/`DonutChartCard` show a
part-to-whole with the total in the centre and a legend with values and shares;
beyond `max` slices (default five) the rest folds into a neutral Other, and
`onSelect` turns legend rows into buttons.

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
