import { test, expect } from "@playwright/test"

test("command palette shows query results beside filtered pages", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/api/session")
        ? { email: "person@example.test", services: [] }
        : [],
    })
  )
  await page.goto("/")
  await page.getByRole("button", { name: "Commands (⌘K)" }).click()
  const dialog = page.getByRole("dialog")
  const input = dialog.getByRole("combobox")
  await input.fill("co")
  // Static pages still filter; the starter's search returns records later.
  await expect(dialog.getByRole("option", { name: "Components" })).toBeVisible()
  await expect(dialog.getByRole("status")).toContainText("Searching")
  await expect(
    dialog.getByRole("option", { name: /Corner Market/ })
  ).toBeVisible()
  await input.fill("corner")
  await expect(dialog.getByRole("option", { name: "Components" })).toHaveCount(
    0
  )
  await expect(
    dialog.getByRole("option", { name: /Corner Market/ })
  ).toBeVisible()
  await expect(dialog.getByText("No matches")).toHaveCount(0)
  // A record matched on its amount, which cmdk's own filter would hide.
  await input.fill("64.2")
  await expect(
    dialog.getByRole("option", { name: /Corner Market/ })
  ).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await page.getByRole("button", { name: "Commands (⌘K)" }).click()
  await expect(page.getByRole("dialog").getByRole("combobox")).toHaveValue("")
  await expect(
    page.getByRole("dialog").getByRole("option", { name: /Corner Market/ })
  ).toHaveCount(0)
})
