import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";
import {
  activateByTestId,
  byTestId,
  clickByTestId,
  dialogByName,
  fillByTestId,
} from "./support/e2e-locators";

test.describe("cobertura funcional por módulos críticos", () => {
  test("ventas bloquea pago insuficiente antes de enviar la venta", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/sales");

    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();

    await fillByTestId(page, "sales-product-search", "COCA-600");
    await page.getByRole("button", { name: /Coca-Cola 600 ml/i }).click();

    const checkoutButton = byTestId(page, "sales-checkout-button");

    await fillByTestId(page, "sales-paid-amount", "10");

    await expect(page.getByText("Pago insuficiente. Falta $8.00.")).toBeVisible();
    await expect(
      page.getByText("Pago insuficiente. Falta $8.00 para completar la venta."),
    ).toBeVisible();
    await expect(checkoutButton).toBeDisabled();
    await expect(page.getByText("Venta registrada correctamente.")).toHaveCount(0);
  });

  test("ventas no agrega automáticamente el primer producto con Enter o botón Agregar", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/sales");

    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();

    const emptyTicket = byTestId(page, "sales-ticket-empty");
    const addSearchMatchButton = byTestId(page, "sales-add-search-match");
    const searchInput = byTestId(page, "sales-product-search");

    await expect(emptyTicket).toBeVisible();
    await expect(addSearchMatchButton).toBeDisabled();

    await fillByTestId(page, "sales-product-search", "CO");
    await expect(addSearchMatchButton).toBeDisabled();
    await searchInput.press("Enter");

    await expect(emptyTicket).toBeVisible();
    await expect(
      page.getByText("Enter solo agrega coincidencias exactas de SKU."),
    ).toBeVisible();

    await fillByTestId(page, "sales-product-search", "COCA-600");
    await expect(addSearchMatchButton).toBeEnabled();
    await searchInput.press("Enter");

    await expect(emptyTicket).toHaveCount(0);
    await expect(byTestId(page, "sales-cart-items")).toContainText("COCA-600");
  });

  test("productos permite crear, desactivar y eliminar físicamente sin dejarlo disponible para venta", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();

    await activateByTestId(page, "products-create-button");

    const productDialog = dialogByName(page, "Nuevo producto");
    await expect(productDialog).toBeVisible();
    await fillByTestId(productDialog, "product-form-sku", "AGUA-1L");
    await fillByTestId(productDialog, "product-form-barcode", "7500000000011");
    await fillByTestId(productDialog, "product-form-name", "Agua Mineral 1L");
    await fillByTestId(productDialog, "product-form-cost-price", "8");
    await fillByTestId(productDialog, "product-form-sale-price", "15");
    await fillByTestId(productDialog, "product-form-initial-stock", "12");
    await fillByTestId(productDialog, "product-form-min-stock", "3");
    await clickByTestId(productDialog, "product-form-submit");

    await expect(page.getByText("Producto creado correctamente.")).toBeVisible();
    await expect(byTestId(page, "product-row-AGUA-1L")).toBeVisible();

    await clickByTestId(page, "product-edit-AGUA-1L");
    const editDialog = dialogByName(page, "Editar producto");
    await expect(editDialog).toBeVisible();
    await fillByTestId(editDialog, "product-form-sale-price", "16");
    await clickByTestId(editDialog, "product-form-submit");

    await expect(page.getByText("Producto actualizado correctamente.")).toBeVisible();
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("$16.00");

    await clickByTestId(page, "product-toggle-AGUA-1L");

    await expect(page.getByText("Estado del producto actualizado.")).toBeVisible();
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("Oculto para venta");
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("Activar");

    await clickByTestId(page, "product-delete-AGUA-1L");
    const deleteDialog = dialogByName(page, "Eliminar producto");
    await expect(deleteDialog).toBeVisible();
    await clickByTestId(deleteDialog, "products-delete-confirm-button");

    await expect(
      page.getByText("Producto eliminado permanentemente. Historial preservado."),
    ).toBeVisible();
    await expect(byTestId(page, "product-row-AGUA-1L")).toHaveCount(0);

    await page.goto("/sales");
    await fillByTestId(page, "sales-product-search", "AGUA-1L");

    await expect(page.getByRole("button", { name: /Agua Mineral 1L/i })).toHaveCount(0);
    await expect(page.getByText("Busca o selecciona un producto para iniciar la venta.")).toBeVisible();
  });

  test("productos permite eliminar todo el catálogo con confirmación explícita", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();
    await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();

    await clickByTestId(page, "products-delete-all-button");

    const deleteAllDialog = dialogByName(page, "Eliminar todos los productos");
    await expect(deleteAllDialog).toBeVisible();
    await expect(byTestId(deleteAllDialog, "products-delete-all-confirm-button")).toBeDisabled();

    await fillByTestId(deleteAllDialog, "products-delete-all-confirm-text", "ELIMINAR");
    await clickByTestId(deleteAllDialog, "products-delete-all-confirm-button");

    await expect(page.getByText(/Se eliminaron \d+ productos del catálogo\./)).toBeVisible();
    await expect(byTestId(page, "product-row-COCA-600")).toHaveCount(0);
  });

  test("inventario registra entrada, salida e historial operativo", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
    await expect(page.getByText("24 unidades")).toBeVisible();

    await page.getByRole("tab", { name: "Entradas y salidas" }).click();
    await page.getByLabel("Producto").click();
    await page.getByRole("option", { name: /COCA-600 · Coca-Cola 600 ml · stock 24/i }).click();
    await fillByTestId(page, "inventory-form-quantity", "5");
    await fillByTestId(page, "inventory-form-reason", "Compra proveedor E2E");
    await clickByTestId(page, "inventory-submit-in");

    await expect(page.getByText("Entrada registrada correctamente.")).toBeVisible();
    await expect(page.getByText("29 unidades")).toBeVisible();

    await page.getByRole("tab", { name: "Entradas y salidas" }).click();
    await page.getByLabel("Producto").click();
    await page.getByRole("option", { name: /COCA-600 · Coca-Cola 600 ml · stock 29/i }).click();
    await fillByTestId(page, "inventory-form-quantity", "2");
    await page.getByRole("combobox", { name: /^Motivo\b/i }).click();
    await page.getByRole("option", { name: "Caducidad" }).click();
    await expect(byTestId(page, "inventory-submit-in")).toBeDisabled();
    await clickByTestId(page, "inventory-submit-out");

    await expect(page.getByText("Salida registrada correctamente.")).toBeVisible();
    await expect(page.getByText("27 unidades")).toBeVisible();

    await page.getByRole("tab", { name: "Historial" }).click();
    await page.getByLabel("Buscar movimientos").fill("E2E");

    await expect(page.getByText("Compra proveedor E2E")).toBeVisible();

    await page.getByLabel("Buscar movimientos").fill("merma");
    await expect(page.getByText("Caducidad").first()).toBeVisible();
    await expect(byTestId(page, "inventory-movement-movement-2")).toContainText(
      "COCA-600",
    );
    await expect(byTestId(page, "inventory-movement-movement-2")).toContainText(
      "7501055300075",
    );
    await expect(byTestId(page, "inventory-movement-movement-2")).toContainText(
      "Coca-Cola 600 ml",
    );
  });

  test("vendedor solo consulta inventario y productos sin acciones administrativas", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();
    await expect(byTestId(page, "products-create-button")).toHaveCount(0);
    await expect(byTestId(page, "product-edit-COCA-600")).toHaveCount(0);
    await expect(byTestId(page, "product-toggle-COCA-600")).toHaveCount(0);
    await expect(byTestId(page, "product-delete-COCA-600")).toHaveCount(0);
    await expect(byTestId(page, "products-delete-all-button")).toHaveCount(0);

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
    await expect(page.getByText("Permiso: solo consulta")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Existencias" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Historial" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Entradas y salidas" })).toHaveCount(0);
    await expect(byTestId(page, "inventory-submit-in")).toHaveCount(0);
    await expect(byTestId(page, "inventory-submit-out")).toHaveCount(0);
  });

});
