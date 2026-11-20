import { test } from "node:test"
import assert from "node:assert/strict"
import { ApiError, parseJson, getJson, errorMessage } from "../src/lib/api"
import {
  formatBytes,
  formatDuration,
  formatPercent,
  formatCount,
  pluralize,
  parseTime,
  formatRelative,
  formatDateTime,
} from "../src/lib/format"
test("API parsing preserves status and handles proxy responses", async () => {
  assert.deepEqual(await parseJson(new Response('{"ok":true}')), { ok: true })
  assert.equal(await parseJson(new Response(null, { status: 204 })), null)
  await assert.rejects(
    parseJson(new Response('{"error":"Denied"}', { status: 403 })),
    (e) => e instanceof ApiError && e.status === 403 && e.message === "Denied"
  )
  await assert.rejects(
    parseJson(new Response("proxy", { status: 502 })),
    /Request failed \(502\)/
  )
  assert.equal(errorMessage(null), "Something went wrong")
  assert.deepEqual(
    await getJson("data:application/json,%7B%22ok%22%3Atrue%7D"),
    { ok: true }
  )
})
test("generic formatting boundaries", () => {
  assert.equal(formatBytes(-1), "—")
  assert.equal(formatBytes(1024), "1.0 KiB")
  assert.equal(formatBytes(0), "0 B")
  assert.equal(formatDuration(90061), "1d 1h")
  assert.equal(formatDuration(-1), "0s")
  assert.equal(formatPercent(9.25), "9.3%")
  assert.equal(pluralize(1, "file"), "1 file")
  assert.equal(pluralize(2, "file"), "2 files")
  assert.ok(formatCount(1200))
  assert.equal(
    parseTime("20261120T163807Z-ab12"),
    Date.UTC(2026, 10, 20, 16, 38, 7)
  )
  assert.equal(formatRelative("bad"), "—")
  assert.equal(formatDateTime("bad"), "—")
  assert.equal(formatRelative("2026-01-01", Date.UTC(2026, 0, 1)), "just now")
})
