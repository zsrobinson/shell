import { test } from "node:test"
import assert from "node:assert/strict"
import { formatDateTime, formatRelative, parseTime } from "../src/lib/format"
import { ApiError, parseJson } from "../src/lib/api"

test("parseTime reads Minecraft's ban and whitelist dates", () => {
  assert.equal(
    parseTime("2026-11-20 12:00:00 +0000"),
    Date.UTC(2026, 10, 20, 12, 0, 0)
  )
  // The offset is applied: 12:00 at -0500 is 17:00 UTC.
  assert.equal(
    parseTime("2026-11-20 12:00:00 -0500"),
    Date.UTC(2026, 10, 20, 17, 0, 0)
  )
  assert.equal(
    parseTime("2026-11-20 12:00:00 +0530"),
    Date.UTC(2026, 10, 20, 6, 30, 0)
  )
  assert.equal(
    parseTime("2026-11-20 12:00:00 +05:30"),
    Date.UTC(2026, 10, 20, 6, 30, 0)
  )
})

test("parseTime reads compact snapshot ids and ISO strings", () => {
  assert.equal(
    parseTime("20261122T043201Z-ffc3be"),
    Date.UTC(2026, 10, 22, 4, 32, 1)
  )
  assert.equal(
    parseTime("2026-11-22T04:32:01.000Z"),
    Date.UTC(2026, 10, 22, 4, 32, 1)
  )
  assert.equal(
    parseTime(" 2026-11-22T04:32:01Z "),
    Date.UTC(2026, 10, 22, 4, 32, 1)
  )
})

test("parseTime returns NaN for values that are not times", () => {
  for (const value of ["", "forever", "bad", "2026-13-45 99:99:99 +0000"])
    assert.ok(Number.isNaN(parseTime(value)), value)
  assert.ok(Number.isNaN(parseTime(undefined as unknown as string)))
})

test("formatters accept Minecraft dates and epoch milliseconds", () => {
  const now = Date.UTC(2026, 10, 20, 14, 0, 0)
  assert.equal(formatRelative("2026-11-20 12:00:00 +0000", now), "2 hours ago")
  assert.equal(formatRelative(now - 60_000, now), "1 minute ago")
  assert.notEqual(formatDateTime("2026-11-20 12:00:00 +0000"), "—")
  assert.notEqual(formatDateTime(now), "—")
  assert.equal(formatDateTime("forever"), "—")
  assert.equal(formatDateTime(NaN), "—")
  for (const text of [
    formatDateTime("20261122T043201Z-ffc3be"),
    formatRelative("20261122T043201Z-ffc3be", now),
  ])
    assert.doesNotMatch(text, /Invalid|NaN/)
})

test("API errors carry the server's code", async () => {
  await assert.rejects(
    parseJson(
      new Response('{"error":"Confirm again","code":"intent-required"}', {
        status: 409,
      })
    ),
    (e) =>
      e instanceof ApiError &&
      e.status === 409 &&
      e.code === "intent-required" &&
      e.message === "Confirm again"
  )
  await assert.rejects(
    parseJson(new Response('{"error":"Denied"}', { status: 403 })),
    (e) => e instanceof ApiError && e.code === undefined
  )
})
