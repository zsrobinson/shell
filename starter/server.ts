import { readFileSync } from "node:fs"
import { createShellServer, mountStatic, serve } from "@zsrobinson/shell/server"
const required = (key: string) => {
  const value = process.env[key]
  if (!value) throw Error(`Missing ${key}`)
  return value
}
const app = createShellServer({
  allowSameOriginFrames: true,
  issuer: required("ACCESS_ISSUER"),
  audience: required("ACCESS_AUD"),
  publicOrigin: required("PUBLIC_ORIGIN"),
  services: () =>
    JSON.parse(readFileSync(required("SERVICE_MANIFEST"), "utf8")),
  metrics: {
    authorize: (r) =>
      Boolean(process.env.METRICS_TOKEN) &&
      r.headers.get("Authorization") === `Bearer ${process.env.METRICS_TOKEN}`,
  },
})
const items = [{ id: "example", name: "Example item" }]
app.get("/api/items", (c) => c.json(items))
app.get("/api/items/:id", (c) => {
  const item = items.find((i) => i.id === c.req.param("id"))
  return item ? c.json(item) : c.json({ error: "Item not found" }, 404)
})
mountStatic(app)
serve({
  fetch: app.fetch,
  hostname: process.env.BIND_ADDRESS || "127.0.0.1",
  port: Number(process.env.PORT || 8787),
})
