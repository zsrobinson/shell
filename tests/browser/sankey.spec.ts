import { test, expect, type Page } from "@playwright/test"

const mockApi = (page: Page) =>
  page.route("**/api/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/api/session")
        ? { email: "person@example.test", services: [] }
        : [],
    })
  )

for (const width of [390, 1280]) {
  test(`sankey fits its card and keeps labels whole at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockApi(page)
    await page.goto("/components?theme=light")
    const chart = page.locator(
      '[data-slot="chart"][aria-label="Example budget flow from income to categories"]'
    )
    await chart.scrollIntoViewIfNeeded()
    await expect(
      chart.locator('[data-slot="sankey-node"]').first()
    ).toBeVisible()

    // The page never scrolls sideways; a narrow card scrolls the chart inside.
    const layout = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>(
        '[data-slot="sankey-chart"]'
      )!
      return {
        page: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        inner: scroller.scrollWidth > scroller.clientWidth + 1,
      }
    })
    expect(layout.page).toBeLessThanOrEqual(layout.viewport)
    expect(layout.inner).toBe(width < 600)

    // Every label sits inside the drawing and clear of the others.
    const surface = await chart.locator("svg.recharts-surface").boundingBox()
    if (!surface) throw Error("Missing chart layout")
    const labels = await chart
      .locator('[data-slot="sankey-node"] text')
      .evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect()
          return {
            text: el.textContent ?? "",
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
          }
        })
      )
    expect(labels.map((l) => l.text)).toContain("Saved$2,270")
    for (const l of labels) {
      expect(l.left, l.text).toBeGreaterThanOrEqual(surface.x - 1)
      expect(l.right, l.text).toBeLessThanOrEqual(surface.x + surface.width + 1)
      expect(l.top, l.text).toBeGreaterThanOrEqual(surface.y - 1)
      expect(l.bottom, l.text).toBeLessThanOrEqual(
        surface.y + surface.height + 1
      )
    }
    for (const [i, a] of labels.entries())
      for (const b of labels.slice(i + 1)) {
        const overlap =
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1
        expect(overlap, `${a.text} overlaps ${b.text}`).toBe(false)
      }

    // Hovering a node shows its value and highlights its links.
    const food = chart.locator('[data-slot="sankey-node"][data-id="food"] rect')
    await food.scrollIntoViewIfNeeded()
    await food.hover({ force: true })
    const tooltip = chart.locator(".recharts-tooltip-wrapper")
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText("Food")
    await expect(tooltip).toContainText("$860")
  })
}
