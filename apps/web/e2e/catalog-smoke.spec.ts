import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

test.describe("catálogo e inventario responsive", () => {
  test("productos carga catálogo y permite buscar por SKU", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();

    await page.getByLabel("Buscar productos").fill("COCA-600");

    await expect(page.getByText("COCA-600")).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
  });

  test("inventario muestra existencias sin tabla horizontal obligatoria", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
    await expect(page.getByText("Principal")).toBeVisible();
  });
});
