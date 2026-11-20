# shell

The shared frame and building blocks for small internal web apps: official
shadcn/ui Luma components (Base UI, `base-luma`, pointer cursors), Flexoki,
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

| Import                               | Contents                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `@zsrobinson/shell`                  | AppShell, AppIcon, Page, PageHeader, PageTitle, PageMeta, PageActions, theme hooks, toast, app types     |
| `@zsrobinson/shell/styles.css`       | Tailwind v4, Flexoki tokens, Geist, radii, Luma variants and `text-code` (0.8125rem)                     |
| `@zsrobinson/shell/ui/*`             | Official Luma primitives: button, card, sidebar, table, field, dialog, and the other UI modules          |
| `@zsrobinson/shell/blocks/*`         | confirm-action, copy-button, detail-list, list-row, query-error, file-drop, upload-progress, page-states |
| `@zsrobinson/shell/lib/api`          | ApiError, parseJson, getJson, errorMessage                                                               |
| `@zsrobinson/shell/lib/format`       | Bytes/MiB, duration, relative/absolute time, percent, count, pluralize, parseTime                        |
| `@zsrobinson/shell/lib/use-upload`   | Progress, mutation notifications and upload limit; app supplies transport and cache refresh              |
| `@zsrobinson/shell/hooks/use-mobile` | Mobile breakpoint hook                                                                                   |
| `@zsrobinson/shell/server`           | createShellServer, mountStatic, serve, ServerOptions, ShellEnv, RequestMetadata                          |

Import the stylesheet once; the starter's own CSS is only the import and an
`@source` directive. All theme decisions belong in shell, not app CSS. Pair
`text-code` with `font-mono`. Supply data and app navigation to AppShell; it has
no hostname or service inventory built in. QueryError accepts any error and
never imports an app's API module. NotFound accepts an optional `homeLabel`.

The UI components were generated with
`shadcn init --preset b1GxuTvxQ --template vite --pointer`, then `shadcn add`.
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
