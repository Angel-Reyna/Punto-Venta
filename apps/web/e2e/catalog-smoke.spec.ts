import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

test.describe("catálogo e inventario responsive", () => {
  test("productos carga catálogo y permite buscar por SKU", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();

    await page.getByLabel("Buscar productos").fill("COCA-600");

    await expect(page.getByText("COCA-600", { exact: true })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
  });

  test("inventario muestra existencias sin tabla horizontal obligatoria", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
    await expect(page.getByText("Existencias actuales")).toBeVisible();
    await expect(page.getByText("Stock actual")).toBeVisible();
    await expect(page.getByText("24 unidades")).toBeVisible();
    await expect(page.getByText("Disponible", { exact: true })).toBeVisible();
  });
});
