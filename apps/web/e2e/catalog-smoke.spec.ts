import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

test.describe("catálogo e inventario responsive", () => {
  test("productos carga catálogo y permite buscar por SKU", async ({
    page,
  }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/products");

    await expect(
      page.getByRole("heading", { name: "Productos", level: 1 }),
    ).toBeVisible();
    await expect(page.getByTestId("products-visual-dashboard")).toBeVisible();
    await expect(page.getByText("Gestión de catálogo")).toBeVisible();
    await expect(page.getByText("Requieren atención")).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();

    await page.getByLabel("Buscar productos").fill("COCA-600");

    await expect(page.getByText("COCA-600", { exact: true })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
  });

  test("inventario muestra existencias sin tabla horizontal obligatoria", async ({
    page,
  }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/inventory");

    await expect(
      page.getByRole("heading", { name: "Inventario", level: 1 }),
    ).toBeVisible();
    await expect(page.getByTestId("inventory-visual-dashboard")).toBeVisible();
    await expect(page.getByText("Control de inventario")).toBeVisible();
    await expect(page.getByText("Stock saludable")).toBeVisible();
    await expect(page.getByText("Vista rápida de existencias")).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
    await expect(page.getByText("Existencias actuales")).toBeVisible();
    const stockItem = page.getByTestId("inventory-stock-item-COCA-600");
    await expect(stockItem.getByText("Stock actual")).toBeVisible();
    await expect(stockItem.getByRole("heading", { name: "24 unidades" })).toBeVisible();
    await expect(page.getByTestId("inventory-stock-status-COCA-600")).toContainText("Disponible");
    await expect(stockItem).toContainText("Ubicación: Almacén Principal");
  });
});
