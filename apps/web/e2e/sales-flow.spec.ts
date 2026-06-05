import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

test.describe("flujo crítico de ventas", () => {
  test("vendedor registra venta en efectivo sin prerrequisitos operativos", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/sales");

    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();
    await expect(page.getByText("Vista vendedor: ajustes con aprobación")).toBeVisible();

    await page.getByLabel("F3 · Buscar por SKU o nombre").fill("COCA-600");
    await page.getByRole("button", { name: /Coca-Cola 600 ml/i }).click();

    await expect(page.getByText("Orden de venta")).toBeVisible();
    await expect(
      page.getByTestId("sales-cart-items").getByText("COCA-600", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("$18.00").last()).toBeVisible();

    await page.getByLabel("Cliente opcional").fill("Cliente E2E");
    await page.getByLabel("Pago con").fill("20");
    await page.getByRole("button", { name: /Cobrar venta/i }).click();

    await expect(page.getByText("Venta registrada correctamente.")).toBeVisible();
    await expect(page.getByText("PV-E2E-0002")).toBeVisible();
    await expect(page.getByText("Cliente E2E")).toBeVisible();
    await expect(page.getByText("Busca o selecciona un producto para iniciar la venta.")).toBeVisible();
  });
});
