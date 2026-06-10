import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";
import { inventoryStockItem } from "./support/e2e-locators";

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
    const visualDashboard = page.getByTestId("inventory-visual-dashboard");
    await expect(visualDashboard).toBeVisible();
    await expect(visualDashboard.getByRole("heading", { name: "Estado y movimientos" })).toBeVisible();
    await expect(visualDashboard).toContainText("Movimientos");
    await expect(visualDashboard).toContainText("Unidades");
    await expect(page.getByRole("tab", { name: "Asignaciones" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Filtros/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Existencias actuales" })).toBeVisible();
    const stockItem = inventoryStockItem(page, "COCA-600");
    await expect(stockItem.getByText("Coca-Cola 600 ml", { exact: true })).toBeVisible();
    await expect(stockItem).toContainText("Stock actual y mínimo");
    await expect(stockItem).toContainText("Actual: 24");
    await expect(page.getByTestId("inventory-stock-status-COCA-600")).toContainText("Stock bajo");
    await expect(stockItem).toContainText("Almacén: Principal");
  });
});
