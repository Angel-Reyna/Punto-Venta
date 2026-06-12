import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";
import {
  activateByTestId,
  byTestId,
  clickByTestId,
  dialogByName,
  fillByTestId,
  salesHistorySale,
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



  test("ventas permite devolver varios productos en una misma operación", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/sales?view=history");

    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Historial operativo", selected: true })).toBeVisible();
    const saleCard = salesHistorySale(page, "sale-1");
    await expect(saleCard.getByText("PV-0001", { exact: true })).toBeVisible();
    await expect(saleCard).toContainText("1× Coca-Cola 600 ml · 2× Botana Salada 50g");

    await page.getByRole("button", { name: "Devolver" }).click();

    const returnDialog = dialogByName(page, /Registrar devolución PV-0001/);
    await expect(returnDialog).toBeVisible();
    await expect(returnDialog).toContainText("Devuelve una o varias partidas vendidas en la misma operación.");
    await expect(returnDialog).toContainText("0 productos seleccionados");

    await fillByTestId(returnDialog, "sales-return-quantity-sale-item-1", "1");
    await fillByTestId(returnDialog, "sales-return-quantity-sale-item-2", "2");

    await expect(returnDialog).toContainText("2 productos seleccionados");
    await expect(returnDialog).toContainText("3 unidades a devolver");

    await fillByTestId(returnDialog, "sales-return-reason", "Cliente devolvió varios productos");
    await clickByTestId(returnDialog, "sales-return-submit");

    await expect(page.getByText("Devolución registrada correctamente. El stock fue restaurado.")).toBeVisible();
    await expect(saleCard).toContainText("Devuelta");
    await expect(saleCard.getByRole("button", { name: "Devolver" })).toBeDisabled();
  });


  test("vendedor solicita devolución para aprobación del administrador", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/sales?view=history");

    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();
    await expect(page.getByText("Vista vendedor: ajustes con aprobación")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Historial operativo", selected: true })).toBeVisible();
    await expect(salesHistorySale(page, "sale-1")).toContainText("PV-0001");

    await page.getByRole("button", { name: "Solicitar devolución" }).click();

    const returnDialog = dialogByName(page, /Solicitar devolución PV-0001/);
    await expect(returnDialog).toBeVisible();
    await expect(returnDialog).toContainText("La venta y el inventario no cambiarán hasta que un administrador apruebe");

    await fillByTestId(returnDialog, "sales-return-quantity-sale-item-1", "1");
    await fillByTestId(returnDialog, "sales-return-reason", "Cliente solicita devolución");
    await clickByTestId(returnDialog, "sales-return-submit");

    await expect(page.getByText("Solicitud de devolución enviada al administrador.")).toBeVisible();
    await expect(salesHistorySale(page, "sale-1")).toContainText("Ajuste pendiente");
    await expect(salesHistorySale(page, "sale-1").getByRole("button", { name: "Solicitar devolución" })).toBeDisabled();

    await page.getByRole("tab", { name: "Solicitudes de ajuste" }).click();
    await expect(byTestId(page, "sales-adjustment-requests-panel")).toContainText("Devolución solicitada");
    await expect(byTestId(page, "sales-adjustment-requests-panel")).toContainText("Pendiente");
  });

  test("admin aprueba una solicitud de ajuste pendiente", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/sales");

    await page.getByRole("tab", { name: "Solicitudes de ajuste" }).click();

    const requestsPanel = byTestId(page, "sales-adjustment-requests-panel");
    await expect(requestsPanel).toBeVisible();
    await expect(byTestId(page, "sales-adjustment-request-adjustment-1")).toContainText("Pendiente");

    await clickByTestId(requestsPanel, "sales-adjustment-approve-adjustment-1");

    const reviewDialog = dialogByName(page, "Aprobar solicitud");
    await expect(reviewDialog).toBeVisible();
    await fillByTestId(reviewDialog, "sales-adjustment-review-note", "Aprobado por revisión E2E");
    await clickByTestId(reviewDialog, "sales-adjustment-review-submit");

    await expect(page.getByText("Solicitud aprobada correctamente. El ajuste fue aplicado.")).toBeVisible();
    await requestsPanel.getByRole("button", { name: "Aprobadas" }).click();
    await expect(byTestId(page, "sales-adjustment-request-adjustment-1")).toContainText("Aprobada");

    await page.getByRole("tab", { name: "Historial operativo" }).click();
    await expect(byTestId(page, "sales-history-sale-sale-1")).toContainText("Devolución parcial");
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
    await productDialog.getByRole("combobox", { name: "Categoría" }).click();
    await page.getByRole("option", { name: "Otros" }).click();
    await fillByTestId(productDialog, "product-form-category-name", "Bebidas premium");
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
    await editDialog.getByRole("combobox", { name: "Categoría" }).click();
    await page.getByRole("option", { name: "Otros" }).click();
    await fillByTestId(editDialog, "product-form-category-name", "Hidratación");
    await clickByTestId(editDialog, "product-form-submit");

    await expect(page.getByText("Producto actualizado correctamente.")).toBeVisible();
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("$16.00");
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("Hidratación");

    await clickByTestId(page, "product-toggle-AGUA-1L");

    await expect(page.getByText("Producto desactivado correctamente.")).toBeVisible();
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("Producto inactivo");
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("Activar");

    await clickByTestId(page, "product-toggle-AGUA-1L");

    await expect(page.getByText("Producto activado correctamente.")).toBeVisible();
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("Listo para vender");
    await expect(byTestId(page, "product-row-AGUA-1L")).toContainText("Desactivar");

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

    const deleteAllDialog = dialogByName(page, "Eliminar catálogo completo");
    await expect(deleteAllDialog).toBeVisible();
    await expect(byTestId(deleteAllDialog, "products-delete-all-confirm-button")).toBeDisabled();

    await expect(deleteAllDialog).toContainText("Escribe ELIMINAR TODO para confirmar.");
    await expect(deleteAllDialog).toContainText("no se puede deshacer");
    await fillByTestId(deleteAllDialog, "products-delete-all-confirm-text", "ELIMINAR TODO");
    await clickByTestId(deleteAllDialog, "products-delete-all-confirm-button");

    await expect(page.getByText(/Se eliminaron \d+ productos del catálogo\./)).toBeVisible();
    await expect(byTestId(page, "product-row-COCA-600")).toHaveCount(0);
  });

  test("productos importa Excel y muestra resumen operativo", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();

    await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles({
      name: "productos-punta-venta.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("punta-venta-e2e")
    });

    await expect(page.getByText("Importación finalizada: 1 producto procesado. (1 creado, 0 actualizados, 1 con stock inicial)."))
      .toBeVisible();
  });

  test("inventario registra entrada, salida e historial operativo", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Actual: 24");
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Código interno: COCA-600");
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Código del producto: 7501055300075");
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Almacén: Principal");

    await page.getByRole("tab", { name: "Entradas" }).click();
    await expect(byTestId(page, "inventory-form-reason")).toHaveValue("Reabastecimiento");
    await clickByTestId(page, "inventory-create-warehouse-open");

    const warehouseDialog = dialogByName(page, "Nuevo almacén");
    await expect(warehouseDialog).toBeVisible();
    await expect(byTestId(warehouseDialog, "inventory-create-warehouse-submit")).toBeDisabled();

    await fillByTestId(warehouseDialog, "inventory-create-warehouse-name", "Bodega norte E2E");
    await fillByTestId(warehouseDialog, "inventory-create-warehouse-description", "Mercancía de respaldo");
    await clickByTestId(warehouseDialog, "inventory-create-warehouse-submit");

    await expect(page.getByText("Almacén: Bodega norte E2E creado correctamente.")).toBeVisible();
    await expect(page.getByRole("combobox", { name: /^Almacén/i })).toHaveValue("Bodega norte E2E");

    await page.getByLabel("Producto").click();
    await page.getByRole("option", { name: /COCA-600 · Coca-Cola 600 ml · stock 24/i }).click();
    await fillByTestId(page, "inventory-form-quantity", "5");
    await fillByTestId(page, "inventory-form-reason", "Compra proveedor E2E");
    await clickByTestId(page, "inventory-submit-in");

    await expect(page.getByText("Entrada registrada correctamente.")).toBeVisible();
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Actual: 29");

    await page.getByRole("tab", { name: "Salidas" }).click();
    await expect(byTestId(page, "inventory-form-reason")).toHaveValue("");
    await expect(byTestId(page, "inventory-form-quantity")).toBeDisabled();
    await page.getByLabel("Producto").click();
    await page.getByRole("option", { name: /COCA-600 · Coca-Cola 600 ml · stock 29/i }).click();
    await expect(byTestId(page, "inventory-form-quantity")).toBeEnabled();
    await expect(byTestId(page, "inventory-form-quantity-decrease")).toBeDisabled();
    await clickByTestId(page, "inventory-form-quantity-increase");
    await expect(byTestId(page, "inventory-form-quantity")).toHaveValue("1");
    await clickByTestId(page, "inventory-form-quantity-max");
    await expect(byTestId(page, "inventory-form-quantity")).toHaveValue("24");
    await expect(byTestId(page, "inventory-form-quantity-increase")).toBeDisabled();
    await fillByTestId(page, "inventory-form-quantity", "999");
    await expect(byTestId(page, "inventory-form-quantity")).toHaveValue("24");
    await expect(page.getByText("Se ajustó la salida de 999 unidades al máximo disponible. Almacén: Principal. Disponible: 24 unidades.")).toBeVisible();

    await page.getByRole("combobox", { name: /^Almacén/i }).click();
    await page.getByRole("option", { name: "Bodega norte E2E" }).click();
    await expect(byTestId(page, "inventory-form-quantity")).toHaveValue("5");
    await expect(page.getByText("Se ajustó la salida de 24 unidades al máximo disponible. Almacén: Bodega norte E2E. Disponible: 5 unidades.")).toBeVisible();
    await fillByTestId(page, "inventory-form-quantity", "999");
    await expect(byTestId(page, "inventory-form-quantity")).toHaveValue("5");
    await expect(page.getByText("Se ajustó la salida de 999 unidades al máximo disponible. Almacén: Bodega norte E2E. Disponible: 5 unidades.")).toBeVisible();
    await page.getByRole("combobox", { name: /^Motivo\b/i }).click();
    await page.getByRole("option", { name: "Daños" }).click();
    await expect(byTestId(page, "inventory-submit-in")).toHaveCount(0);
    await clickByTestId(page, "inventory-submit-out");

    await expect(page.getByText("Salida registrada correctamente.")).toBeVisible();
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Actual: 24");

    await page.getByRole("tab", { name: "Existencias" }).click();
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Stock actual y mínimo");
    await expect(byTestId(page, "inventory-stock-item-COCA-600")).toContainText("Actual: 24");
    const principalStockLocation = byTestId(page, "inventory-stock-location-COCA-600-warehouse-1");
    const bodegaStockLocation = page
      .locator('[data-testid^="inventory-stock-location-COCA-600-"]')
      .filter({ hasText: "Bodega norte E2E" })
      .first();

    await expect(principalStockLocation).toContainText("Almacén: Principal");
    await expect(principalStockLocation).toContainText("24 disponibles");
    await expect(bodegaStockLocation).toContainText("Almacén: Bodega norte E2E");
    await expect(bodegaStockLocation).toContainText("0 disponibles");

    await page.getByRole("tab", { name: "Historial" }).click();
    await expect(page.getByText(/Mostrando 1-\d+ de/)).toBeVisible();
    await page.getByLabel("Buscar movimientos").fill("E2E");

    await expect(page.getByText("Compra proveedor E2E")).toBeVisible();

    const entryMovement = page
      .locator('[data-testid^="inventory-movement-"]')
      .filter({ hasText: "Compra proveedor E2E" })
      .first();

    await expect(entryMovement).toContainText("Almacén: Bodega norte E2E");
    await expect(entryMovement).not.toContainText("Otros");

    await page.getByLabel("Buscar movimientos").fill("merma");
    const shrinkageResult = page.locator('[data-testid^="inventory-movement-"]').filter({ hasText: "Daños" }).first();
    await expect(shrinkageResult).toBeVisible();

    await page.getByLabel("Buscar movimientos").fill("");
    await page.getByRole("button", { name: "Merma" }).click();
    await expect(shrinkageResult).toBeVisible();

    await page.getByLabel("Buscar movimientos").fill("Bodega norte E2E");

    const shrinkageMovement = page
      .locator('[data-testid^="inventory-movement-"]')
      .filter({ hasText: "Daños" })
      .filter({ hasText: "Almacén: Bodega norte E2E" })
      .first();

    await expect(shrinkageMovement).toContainText("Clave interna/SKU: COCA-600");
    await expect(shrinkageMovement).toContainText("Código del producto: 7501055300075");
    await expect(shrinkageMovement).toContainText("Coca-Cola 600 ml");
    await expect(shrinkageMovement).toContainText("Almacén: Bodega norte E2E");
  });

  test("vendedor solicita asignación de stock para aprobación", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
    await page.getByRole("tab", { name: "Asignaciones" }).click();

    const requestsPanel = byTestId(page, "inventory-transfer-requests-panel");
    await expect(requestsPanel).toBeVisible();
    await expect(requestsPanel).toContainText("Solicitar asignación de stock");

    await byTestId(page, "inventory-transfer-product").selectOption("product-1");
    await fillByTestId(page, "inventory-transfer-quantity", "3");
    await fillByTestId(page, "inventory-transfer-reason", "Surtir ruta E2E");
    await clickByTestId(page, "inventory-transfer-submit");

    await expect(page.getByText("Solicitud de asignación enviada al administrador.")).toBeVisible();
    await expect(requestsPanel).toContainText("Surtir ruta E2E");
    await expect(requestsPanel).toContainText("Pendiente");
  });

  test("admin aprueba solicitud de asignación y transfiere stock", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/inventory");

    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
    await page.getByRole("tab", { name: "Asignaciones" }).click();

    const requestCard = byTestId(page, "inventory-transfer-request-transfer-1");
    await expect(requestCard).toContainText("Pendiente");
    await expect(requestCard).toContainText("Surtir ruta de ventas E2E");

    await clickByTestId(requestCard, "inventory-transfer-approve-transfer-1");

    const reviewDialog = dialogByName(page, "Aprobar solicitud de asignación");
    await expect(reviewDialog).toBeVisible();
    await fillByTestId(reviewDialog, "inventory-transfer-review-note", "Aprobado para ruta E2E");
    await clickByTestId(reviewDialog, "inventory-transfer-review-submit");

    await expect(page.getByText("Solicitud de asignación aprobada. El stock fue transferido.")).toBeVisible();
    await expect(requestCard).toContainText("Aprobada");
    await expect(requestCard).toContainText("Aprobado para ruta E2E");
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
    await expect(page.getByRole("tab", { name: "Existencias" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Historial" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Asignaciones" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Entradas" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Salidas" })).toHaveCount(0);
    await expect(byTestId(page, "inventory-submit-in")).toHaveCount(0);
    await expect(byTestId(page, "inventory-submit-out")).toHaveCount(0);
  });

});
