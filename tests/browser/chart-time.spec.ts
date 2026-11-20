import { test, expect } from "@playwright/test"
test("area and bar axes and tooltips use real numeric timestamps", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/api/session")
        ? { email: "person@example.test", services: [] }
        : [],
    })
  )
  await page.goto("/components?theme=light")
  for (const label of ["Example player history", "Example backup sizes"]) {
    const chart = page.locator(`[data-slot="chart"][aria-label="${label}"]`)
    await chart.scrollIntoViewIfNeeded()
    await expect(
      chart.locator(".recharts-cartesian-axis-tick-value").first()
    ).toBeVisible()
    const ticks = await chart
      .locator(".recharts-cartesian-axis-tick-value")
      .allTextContents()
    expect(ticks.some((t) => /AM|PM|Nov/.test(t))).toBeTruthy()
    expect(ticks.join(" ")).not.toMatch(/Invalid Date|NaN|—/)
    const box = await chart.boundingBox()
    if (!box) throw Error("Missing chart layout")
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.4)
    const tooltip = chart.locator(".recharts-tooltip-wrapper")
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText("2026")
    await expect(tooltip).not.toContainText("Invalid Date")
  }
})
