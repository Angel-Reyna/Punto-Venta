import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

test.describe("cobertura funcional por módulos críticos", () => {
  test("ventas bloquea pago insuficiente antes de enviar la venta", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/sales");

    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();

    await page.getByLabel("F3 · Buscar por código, SKU o nombre").fill("COCA-600");
    await page.getByRole("button", { name: /Coca-Cola 600 ml/i }).click();

    const checkoutButton = page.getByRole("button", { name: /Cobrar venta/i });

    await page.getByLabel("Pago con").fill("10");

    await expect(page.getByText("Pago insuficiente. Falta $8.00.")).toBeVisible();
    await expect(
      page.getByText("Pago insuficiente. Falta $8.00 para completar la venta."),
    ).toBeVisible();
    await expect(checkoutButton).toBeDisabled();
    await expect(page.getByText("Venta registrada correctamente.")).toHaveCount(0);
  });

  test("productos permite crear, desactivar y eliminar físicamente sin dejarlo disponible para venta", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();

    const createProductButton = page.getByRole("button", { name: "Nuevo producto" });
    await expect(createProductButton).toBeVisible();
    await createProductButton.focus();
    await page.keyboard.press("Enter");

    const productDialog = page.getByRole("dialog", { name: "Nuevo producto" });
    await expect(productDialog).toBeVisible();
    await productDialog.getByRole("textbox", { name: "Clave interna/SKU" }).fill("AGUA-1L");
    await productDialog.getByRole("textbox", { name: "Código del producto" }).fill("7500000000011");
    await productDialog.getByRole("textbox", { name: "Nombre del producto" }).fill("Agua Mineral 1L");
    await productDialog.getByRole("spinbutton", { name: "Costo unitario", exact: true }).fill("8");
    await productDialog.getByRole("spinbutton", { name: "Precio de venta", exact: true }).fill("15");
    await productDialog.getByRole("spinbutton", { name: /^Stock inicial/i }).fill("12");
    await productDialog.getByRole("spinbutton", { name: /^Stock mínimo/i }).fill("3");
    await productDialog.getByRole("button", { name: "Guardar producto" }).click();

    await expect(page.getByText("Producto creado correctamente.")).toBeVisible();
    await expect(page.getByText("Agua Mineral 1L")).toBeVisible();
    await expect(page.getByText("AGUA-1L", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Activar o desactivar Agua Mineral 1L" }).click();

    await expect(page.getByText("Estado del producto actualizado.")).toBeVisible();
    await expect(page.getByText("Inactivo")).toBeVisible();

    await page.getByRole("button", { name: "Eliminar Agua Mineral 1L" }).click();
    await expect(page.getByRole("dialog", { name: "Eliminar producto" })).toBeVisible();
    await page.getByRole("button", { name: "Eliminar producto" }).click();

    await expect(
      page.getByText("Producto eliminado permanentemente. Historial preservado."),
    ).toBeVisible();
    await expect(page.getByText("Agua Mineral 1L")).toHaveCount(0);

    await page.goto("/sales");
    await page.getByLabel("F3 · Buscar por código, SKU o nombre").fill("AGUA-1L");

    await expect(page.getByRole("button", { name: /Agua Mineral 1L/i })).toHaveCount(0);
    await expect(page.getByText("Escanea o busca un producto para iniciar la venta.")).toBeVisible();
  });

  test("inventario registra entrada, salida e historial operativo", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
    await expect(page.getByText("24 unidades")).toBeVisible();

    await page.getByRole("tab", { name: "Entradas y salidas" }).click();
    await page.getByLabel("Producto").click();
    await page.getByRole("option", { name: /COCA-600 · Coca-Cola 600 ml · stock 24/i }).click();
    await page.getByLabel("Cantidad").fill("5");
    await page.getByLabel("Motivo del movimiento").fill("Compra proveedor E2E");
    await page.getByRole("button", { name: "Registrar entrada" }).click();

    await expect(page.getByText("Entrada registrada correctamente.")).toBeVisible();
    await expect(page.getByText("29 unidades")).toBeVisible();

    await page.getByRole("tab", { name: "Entradas y salidas" }).click();
    await page.getByLabel("Producto").click();
    await page.getByRole("option", { name: /COCA-600 · Coca-Cola 600 ml · stock 29/i }).click();
    await page.getByLabel("Cantidad").fill("2");
    await page.getByLabel("Motivo del movimiento").fill("Merma controlada E2E");
    await page.getByRole("button", { name: "Registrar salida" }).click();

    await expect(page.getByText("Salida registrada correctamente.")).toBeVisible();
    await expect(page.getByText("27 unidades")).toBeVisible();

    await page.getByRole("tab", { name: "Historial" }).click();
    await page.getByLabel("Buscar movimientos").fill("E2E");

    await expect(page.getByText("Compra proveedor E2E")).toBeVisible();
    await expect(page.getByText("Merma controlada E2E")).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "Compra proveedor E2E" }).first(),
    ).toContainText("COCA-600 · 7501055300075 · Coca-Cola 600 ml");
  });
});
