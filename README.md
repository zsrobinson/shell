# shell

The shared frame for small internal web apps: a sidebar with an app switcher,
breadcrumbs, the signed-in email, a theme menu and sign-out, plus the official
shadcn/ui **Luma** components (Base UI, `base-luma` style) on the
[Flexoki](https://stephango.com/flexoki) palette with Geist.

It is plain React and CSS. Nothing in it knows about a router, a data layer, a
host name or a list of apps, so a Vite app and an Astro island can use it alike.

## Contents

| Import                         | What it is                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `@zsrobinson/shell`            | `AppShell`, `Page`, `PageHeader`, `PageTitle`, `PageMeta`, `PageActions`, theme hooks, `toast` |
| `@zsrobinson/shell/styles.css` | Tailwind v4, Flexoki tokens, Geist, the Luma variants                                          |
| `@zsrobinson/shell/ui/*`       | Luma components: button, card, dialog, sidebar, table, field, item, …                          |
| `@zsrobinson/shell/hooks/*`    | `use-mobile`                                                                                   |

The components were generated with the shadcn CLI
(`shadcn init --preset b1GxuTvxQ --template vite --pointer`, then `shadcn add …`)
and copied unchanged except for three adaptations:

- imports are relative so the package works without a path alias;
- centered dialogs have a transparent overlay (no dim or blur);
- `sonner` follows the shell theme instead of `next-themes`, and `use-mobile`
  reads the media query synchronously.

`src/shadcn-tailwind.css` is `shadcn/dist/tailwind.css` copied unchanged, so
apps need not install the CLI package. `src/flexoki.css` is the upstream
palette file, unchanged (MIT, Steph Ango).

## Building an app on shell

### Stack

- Vite, React 19, TypeScript, Tailwind v4 (`@tailwindcss/vite`).
- TanStack Router with file-based routes and TanStack Query for **all** server
  data: polling, retries, mutations, invalidation and optimistic updates.
- Hono on Node for the API and static files, behind Cloudflare Access.
- `toast` from this package for mutation feedback. No other UI frameworks.

### Folder layout

```text
app/
  server.ts              Hono: Access check, /api routes, static dist/
  src/domain.ts          Types shared by server and panel
  panel/
    index.html           <html data-hue="…">
    src/
      main.tsx           QueryClient + router
      styles.css         @import "@zsrobinson/shell/styles.css"; @source "./";
      routes/            One file per page (TanStack file routes)
      components/        Page sections, grouped by area
      lib/               api.ts, queries.ts, mutations.ts, format.ts
```

Keep modules small: a route file composes cards; each card owns its own query
and mutation hooks.

### Install

Pin the package by commit and let Tailwind see its sources:

```jsonc
// package.json
"@zsrobinson/shell": "git+https://github.com/zsrobinson/shell.git#<commit>"
```

```css
/* panel/src/styles.css */
@import "@zsrobinson/shell/styles.css";
@source "./";
```

With Vite, serve the package as source so its entry points share one module
graph, and pre-bundle the CommonJS shim Base UI reaches through it:

```ts
optimizeDeps: {
  exclude: ["@zsrobinson/shell"],
  include: ["use-sync-external-store/shim", "use-sync-external-store/shim/with-selector"],
},
resolve: { dedupe: ["react", "react-dom"] },
```

### The frame

```tsx
<AppShell
  name="Example"
  email={session.data?.email} // undefined renders a skeleton
  apps={session.data?.services} // runtime manifest, see below
  nav={<SidebarGroup>…</SidebarGroup>} // the app's own navigation
  breadcrumbs={<Breadcrumb>…</Breadcrumb>}
>
  <Page>
    <PageHeader>
      <div>
        <PageTitle>Things</PageTitle>
        <PageMeta>
          <span>3 of 10 things</span>
        </PageMeta>
      </div>
      <PageActions>
        <Button>New thing</Button>
      </PageActions>
    </PageHeader>
    …
  </Page>
</AppShell>
```

Every app gets the same sidebar width, header height, content width (`max-w-5xl`)
and spacing. The sidebar becomes a sheet below 768 px; `⌘B`/`Ctrl+B` toggles it.

### Access JWT middleware

Every request, including static assets, must carry a valid Cloudflare Access
token. Verify it on the server; never trust a header the client could set.

```ts
import { createRemoteJWKSet, jwtVerify } from "jose"

const keys = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", ACCESS_ISSUER))

app.use("*", async (c, next) => {
  try {
    const { payload } = await jwtVerify(
      c.req.header("Cf-Access-Jwt-Assertion") ?? "",
      keys,
      {
        issuer: ACCESS_ISSUER,
        audience: ACCESS_AUD,
      }
    )
    if (typeof payload.email !== "string")
      return c.json({ error: "Access email required" }, 401)
    c.set("email", payload.email)
  } catch {
    return c.json({ error: "Access authentication required" }, 401)
  }
  // Mutations must come from the app's own origin.
  if (
    !["GET", "HEAD"].includes(c.req.method) &&
    c.req.header("Origin") !== PUBLIC_ORIGIN
  )
    return c.json({ error: "Origin rejected" }, 403)
  await next()
})
```

Expose `GET /api/session` returning `{ email, services }`. Sign-out is the
Access endpoint `/cdn-cgi/access/logout`, which the user menu links to.

### Runtime app switcher manifest

`services` is an array loaded at runtime from deployment configuration, never
committed to an app:

```json
[
  { "name": "Example", "url": "https://example.example.com/", "colour": "gr" },
  {
    "name": "Photos",
    "url": "https://photos.example.com/",
    "icon": "/icon.png"
  }
]
```

- `icon` is an image URL (absolute or root-relative) or one or two characters;
  without it the tile shows the name's first letter.
- `colour` is a Flexoki hue key (`re or ye gr cy bl pu ma`) or any CSS colour.
- The entry whose origin matches the page is marked current.
- Hovering or focusing an entry preconnects to its origin and prefetches its
  page once. Switching is a normal cross-origin navigation; there are no
  cross-origin view transitions.

Only list trusted `http(s)` URLs.

### Theme and per-app hue

Neutrals are the Flexoki base scale (paper, 50 … 950, black) in the mapping
Flexoki recommends: light uses paper/50/100/150 for surfaces and 600/black for
text; dark uses black/950/900/850 and 500/200. Destructive is red 600 / 400.

One setting picks an optional hue for the primary action and charts:

```html
<html lang="en" data-hue="gr"></html>
```

`re`, `or`, `ye`, `gr`, `cy`, `bl`, `pu` or `ma`; light mode uses the hue's 600
value and dark mode its 400 value. Leave it off for monochrome.

Dark mode follows the system through CSS alone, so the first paint is right
without a script. The user menu can pin Light or Dark; the choice is stored per
origin and applied when the shell is imported.

### Docker image

Build the panel in one stage and ship only what runs:

```dockerfile
FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
USER node
CMD ["node_modules/.bin/tsx", "server.ts"]
```

Serve `dist/assets/*` with `Cache-Control: public, max-age=31536000, immutable`
(the file names are content hashes, fonts included) and `index.html` without
long caching. Keep secrets in mounted files, not in the image or the repository.

## Design rules

- **No taglines, subheads, slogans or marketing copy.** A page header is a plain
  title plus real data, status and actions. `PageHeader` has no description
  slot on purpose.
- Show real data only. If a value cannot be measured, say "Unavailable" rather
  than inventing a number or a chart.
- Empty states say plainly what is missing and offer one action.
- Pages over dialogs. Anything with more than a sentence of explanation or a
  form gets its own routed page. Dialogs are for short confirmations
  (stop, restart, delete, upgrade); destructive ones may ask the person to
  type the resource's name.
- Skeletons first: render the frame at once and fill sections as queries land.
  Never block navigation on a fetch.
- Every mutation shows a busy state, disables its control while running and
  reports the outcome in a toast using the same verb as its button.
- No gradient blobs, emoji, decorative icons beside headings, oversized hero
  cards or rows of badges. Calm type: one 20 px page title, 16 px card titles,
  14 px body.
- Keyboard first: visible focus, real links for navigation, Enter submits,
  Escape closes. Check every page at 390 px wide.

## Development

```sh
npm install
npm run check   # typecheck, lint, format check, CSS build
```

MIT licensed. Geist and Geist Mono keep their upstream licenses.
