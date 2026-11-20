import { Hono } from "hono"
import { routePath } from "hono/route"
import { serveStatic } from "@hono/node-server/serve-static"
import { createRemoteJWKSet, jwtVerify } from "jose"
export { serve } from "@hono/node-server"

export type RequestMetadata = {
  method: string
  route: string
  status: number
  durationMs: number
}
export type ShellEnv = { Variables: { email: string } }
export type ServerOptions = {
  issuer: string
  audience: string
  publicOrigin: string
  services: () => unknown | Promise<unknown>
  /** For an embedded same-origin component gallery. Defaults to frame-ancestors none. */
  allowSameOriginFrames?: boolean
  /** Receives only bounded metadata. Defaults to one JSON line on stdout. */
  log?: (metadata: RequestMetadata) => void
  /** Scraping is opt-in and should be restricted to the private monitoring network. */
  metrics?: { authorize: (request: Request) => boolean | Promise<boolean> }
}

/** Access-authenticated Hono app. Register app routes before mountStatic(). */
export function createShellServer(options: ServerOptions) {
  const app = new Hono<ShellEnv>()
  app.onError((_error, c) => c.json({ error: "Internal server error" }, 500))
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff")
    c.header("Referrer-Policy", "same-origin")
    c.header(
      "Content-Security-Policy",
      `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors ${options.allowSameOriginFrames ? "'self'" : "'none'"}; base-uri 'self'; form-action 'self'`
    )
    await next()
  })
  const keys = createRemoteJWKSet(
    new URL("/cdn-cgi/access/certs", options.issuer)
  )
  const series = new Map<
    string,
    { labels: string; count: number; seconds: number; buckets: number[] }
  >()
  const bounds = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  app.use("*", async (c, next) => {
    const started = performance.now()
    await next()
    // routePath is the registered pattern, never the URL or its query string.
    const route = routePath(c) || "unmatched"
    const method = [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ].includes(c.req.method)
      ? c.req.method
      : "OTHER"
    const durationMs = performance.now() - started
    const metadata = { method, route, status: c.res.status, durationMs }
    try {
      ;(options.log ?? ((value) => console.log(JSON.stringify(value))))(
        metadata
      )
    } catch {
      /* Observability must not fail requests. */
    }
    if (route === "/metrics") return
    const labels = `method=${JSON.stringify(method)},route=${JSON.stringify(route)},status=${JSON.stringify(String(c.res.status))}`
    let point = series.get(labels)
    if (!point) {
      point = { labels, count: 0, seconds: 0, buckets: bounds.map(() => 0) }
      series.set(labels, point)
    }
    point.count++
    point.seconds += durationMs / 1000
    bounds.forEach((bound, index) => {
      if (durationMs / 1000 <= bound) point.buckets[index]++
    })
  })
  if (options.metrics)
    app.get("/metrics", async (c) => {
      if (!(await options.metrics!.authorize(c.req.raw)))
        return c.body(null, 403)
      const lines = [
        "# TYPE shell_http_requests_total counter",
        "# TYPE shell_http_request_duration_seconds histogram",
      ]
      for (const p of series.values()) {
        lines.push(`shell_http_requests_total{${p.labels}} ${p.count}`)
        bounds.forEach((bound, i) =>
          lines.push(
            `shell_http_request_duration_seconds_bucket{${p.labels},le="${bound}"} ${p.buckets[i]}`
          )
        )
        lines.push(
          `shell_http_request_duration_seconds_bucket{${p.labels},le="+Inf"} ${p.count}`,
          `shell_http_request_duration_seconds_sum{${p.labels}} ${p.seconds}`,
          `shell_http_request_duration_seconds_count{${p.labels}} ${p.count}`
        )
      }
      return c.text(lines.join("\n") + "\n", 200, {
        "Content-Type": "text/plain; version=0.0.4",
      })
    })
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff")
    c.header("Referrer-Policy", "same-origin")
    c.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    try {
      const { payload } = await jwtVerify(
        c.req.header("Cf-Access-Jwt-Assertion") || "",
        keys,
        { issuer: options.issuer, audience: options.audience }
      )
      if (typeof payload.email !== "string")
        return c.json({ error: "Access email required" }, 401)
      c.set("email", payload.email)
    } catch {
      return c.json({ error: "Cloudflare Access authentication required" }, 401)
    }
    if (
      !["GET", "HEAD"].includes(c.req.method) &&
      c.req.header("Origin") !== options.publicOrigin
    )
      return c.json({ error: "Origin rejected" }, 403)
    await next()
  })
  app.get("/api/session", async (c) =>
    c.json({ email: c.get("email"), services: await options.services() })
  )
  return app
}

/** Immutable hashed assets; every HTML navigation revalidates. Call last. */
export function mountStatic(app: Hono<ShellEnv>, root = "./dist") {
  app.use("/assets/*", async (c, next) => {
    await next()
    if (c.res.ok)
      c.header("Cache-Control", "public, max-age=31536000, immutable")
  })
  app.use("*", async (c, next) => {
    c.header("Cache-Control", "no-cache")
    await next()
  })
  app.use("*", serveStatic({ root }))
  app.get("*", serveStatic({ path: `${root}/index.html` }))
}
