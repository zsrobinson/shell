import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { generateKeyPair, exportJWK, SignJWT } from "jose"
import {
  createShellServer,
  mountStatic,
  type RequestMetadata,
} from "../src/server/index"

test("Access, Origin, session, cache boundaries and metadata-only observability", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256")
  const jwk = { ...(await exportJWK(publicKey)), kid: "test", alg: "RS256" }
  const certs = createServer((_, res) =>
    res.end(JSON.stringify({ keys: [jwk] }))
  )
  await new Promise<void>((r) => certs.listen(0, "127.0.0.1", r))
  const issuer = `http://127.0.0.1:${(certs.address() as { port: number }).port}`
  const token = (
    aud = "app",
    email: unknown = "person@example.test",
    expiry = "1h"
  ) =>
    new SignJWT({ email })
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .setIssuer(issuer)
      .setAudience(aud)
      .setExpirationTime(expiry)
      .sign(privateKey)
  const logs: RequestMetadata[] = []
  const app = createShellServer({
    issuer,
    audience: "app",
    publicOrigin: "https://app.example.test",
    services: () => [{ name: "Example", url: "/" }],
    log: (m) => logs.push(m),
    metrics: {
      authorize: (r) => r.headers.get("Authorization") === "Bearer scrape",
    },
  })
  app.get("/api/items/:id", (c) => c.json({ ok: true }))
  app.post("/api/items/:id", (c) => c.json({ ok: true }))
  app.get("/api/fail", () => {
    throw Error("private content")
  })
  const dir = await mkdtemp(join(tmpdir(), "shell-static-"))
  await mkdir(join(dir, "assets"))
  await writeFile(join(dir, "index.html"), "<h1>App</h1>")
  await writeFile(join(dir, "assets/app.js"), "export {}")
  // serveStatic resolves relative to cwd.
  mountStatic(app, relative(process.cwd(), dir))
  const headers = { "Cf-Access-Jwt-Assertion": await token() }
  try {
    assert.equal((await app.request("/api/session")).status, 401)
    for (const invalid of [
      await token("wrong"),
      await token("app", null),
      await token("app", "x", "-1s"),
      "invalid",
    ])
      assert.equal(
        (
          await app.request("/api/session", {
            headers: { "Cf-Access-Jwt-Assertion": invalid },
          })
        ).status,
        401
      )
    assert.equal(
      (await app.request("/assets/app.js", { headers })).headers.get(
        "Cache-Control"
      ),
      "public, max-age=31536000, immutable"
    )
    assert.equal(
      (await app.request("/items/example", { headers })).headers.get(
        "Cache-Control"
      ),
      "no-cache"
    )
    assert.deepEqual(
      await (await app.request("/api/session", { headers })).json(),
      {
        email: "person@example.test",
        services: [{ name: "Example", url: "/" }],
      }
    )
    assert.equal(
      (await app.request("/api/items/secret-id", { method: "POST", headers }))
        .status,
      403
    )
    assert.equal(
      (
        await app.request("/api/items/secret-id", {
          method: "POST",
          headers: { ...headers, Origin: "https://app.example.test" },
        })
      ).status,
      200
    )
    await app.request("/api/items/secret-id?email=private", { headers })
    assert.equal((await app.request("/api/fail", { headers })).status, 500)
    assert.equal((await app.request("/metrics")).status, 403)
    const metrics = await (
      await app.request("/metrics", {
        headers: { Authorization: "Bearer scrape" },
      })
    ).text()
    assert.match(metrics, /shell_http_requests_total/)
    assert.match(metrics, /\/api\/items\/:id/)
    assert.doesNotMatch(metrics, /secret-id|private|person@example/)
    assert.doesNotMatch(
      JSON.stringify(logs),
      /secret-id|private|person@example/
    )
    assert.ok(
      logs.every(
        (l) => Object.keys(l).sort().join() === "durationMs,method,route,status"
      )
    )
  } finally {
    certs.closeAllConnections()
    await new Promise<void>((r) => certs.close(() => r()))
    await rm(dir, { recursive: true, force: true })
  }
})
