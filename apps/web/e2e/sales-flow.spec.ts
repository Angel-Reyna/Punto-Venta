import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";
import { byTestId, salesHistorySale } from "./support/e2e-locators";

test.describe("flujo crítico de ventas", () => {
  test("vendedor registra venta en efectivo sin prerrequisitos operativos", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/sales");

    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();
    await expect(page.getByText("Vista vendedor: ajustes con aprobación")).toBeVisible();
    const warehousePanel = byTestId(page, "sales-source-warehouse-panel");
    await expect(warehousePanel).toContainText("Paso 0 · Almacén de salida");
    await expect(warehousePanel).toContainText("Stock de Vendedor E2E · 10 unidades");

    await page.getByLabel("F3 · Buscar por SKU o nombre").fill("COCA-600");
    await page.getByRole("button", { name: /Coca-Cola 600 ml/i }).click();

    await expect(page.getByText("Orden de venta")).toBeVisible();
    await expect(
      page.getByTestId("sales-cart-items").getByText("COCA-600", { exact: true }),
    ).toBeVisible();
    await expect(byTestId(page, "sales-cart-items")).toContainText("$18.00");

    await page.getByLabel("Cliente opcional").fill("Cliente E2E");
    await page.getByLabel("Pago con").fill("20");
    await page.getByRole("button", { name: /Cobrar venta/i }).click();

    await expect(page.getByText("Venta registrada correctamente.")).toBeVisible();
    const createdSale = salesHistorySale(page, "sale-created-2");
    await expect(createdSale.getByText("PV-E2E-0002")).toBeVisible();
    await expect(createdSale.getByText("Cliente E2E")).toBeVisible();
    await expect(createdSale.getByText("Almacén: Stock de Vendedor E2E")).toBeVisible();
    await expect(page.getByText("Busca o selecciona un producto para iniciar la venta.")).toBeVisible();
  });
});
