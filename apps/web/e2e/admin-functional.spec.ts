import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";
import {
  byTestId,
  clickByTestId,
  dialogByName,
  fillByTestId,
} from "./support/e2e-locators";

test.describe("cobertura funcional administrativa", () => {
  test("usuarios permite crear vendedor, cambiar rol, resetear contraseña y desactivar acceso", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/users");

    await expect(page.getByRole("heading", { name: "Usuarios y vendedores", level: 1 })).toBeVisible();
    await expect(byTestId(page, "user-card-seller-e2e")).toContainText("Vendedor E2E");

    await fillByTestId(page, "users-form-name", "Vendedor Funcional E2E");
    await fillByTestId(page, "users-form-email", "vendedor.funcional@puntaventa.test");
    await fillByTestId(page, "users-form-password", "Temporal123");
    await clickByTestId(page, "users-form-submit");

    await expect(page.getByText("Vendedor creado correctamente. Ya puede iniciar sesión.")).toBeVisible();
    await expect(byTestId(page, "user-card-user-created-4")).toContainText("Vendedor Funcional E2E");

    await clickByTestId(page, "user-role-seller-e2e");
    const roleDialog = dialogByName(page, "Cambiar rol");
    await expect(roleDialog).toBeVisible();
    await roleDialog.getByRole("combobox", { name: "Rol" }).click();
    await page.getByRole("option", { name: "Administrador" }).click();
    await clickByTestId(roleDialog, "users-role-save");

    await expect(page.getByText("Rol actualizado para Vendedor E2E.")).toBeVisible();
    await expect(byTestId(page, "user-card-seller-e2e")).toContainText("Administrador");

    await clickByTestId(page, "user-reset-password-seller-e2e");
    const passwordDialog = dialogByName(page, "Asignar nueva contraseña");
    await expect(passwordDialog).toBeVisible();
    await fillByTestId(passwordDialog, "users-reset-password", "NuevaClave123");
    await fillByTestId(passwordDialog, "users-reset-password-confirm", "NuevaClave123");
    await clickByTestId(passwordDialog, "users-reset-password-save");

    await expect(page.getByText("Contraseña actualizada para Vendedor E2E.")).toBeVisible();

    await clickByTestId(page, "user-toggle-seller-e2e");

    await expect(page.getByText("El acceso de Vendedor E2E fue desactivado.")).toBeVisible();
    await expect(byTestId(page, "user-card-seller-e2e")).toContainText("Inactivo");
  });

  test("reportes consulta ventas por vendedor, snapshots de producto eliminado y PDF operativo", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: "Reportes", level: 1 })).toBeVisible();
    await clickByTestId(page, "reports-consult-button");

    await expect(page.getByText("Venta neta").first()).toBeVisible();
    await expect(page.getByText("$470.00").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Ventas por vendedor" })).toContainText("Vendedor E2E");
    await expect(page.getByRole("region", { name: "Productos más vendidos" })).toContainText(
      "Producto eliminado snapshot E2E",
    );
    await expect(page.getByRole("region", { name: "Ventas recientes" })).toContainText("PV-0001");

    await fillByTestId(page, "reports-search", "SNAP-DEL");

    await expect(page.getByRole("region", { name: "Productos más vendidos" })).toContainText("SNAP-DEL");

    const pdfResponse = page.waitForResponse(
      (response) => response.url().includes("/reports/operations/pdf") && response.status() === 200,
    );
    await clickByTestId(page, "reports-download-pdf-button");
    await pdfResponse;

    await expect(page.getByText("No se pudo descargar el PDF.")).toHaveCount(0);
  });

  test("auditoría carga eventos críticos y filtra por texto operativo", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/audit");

    await expect(page.getByRole("heading", { name: "Auditoría", level: 1 })).toBeVisible();
    await expect(page.getByText("Centro de investigación operativa")).toBeVisible();
    await expect(byTestId(page, "audit-results-heading")).toContainText("3 evento(s) visibles");
    await expect(byTestId(page, "audit-active-filters")).toContainText("Severidad: Todas");
    await expect(byTestId(page, "audit-log-audit-1")).toContainText("Producto eliminado");
    await expect(byTestId(page, "audit-log-audit-1")).toContainText("Severidad Crítica");
    await expect(byTestId(page, "audit-log-audit-1")).toContainText("product-deleted-snapshot");
    await expect(byTestId(page, "audit-after-audit-1")).toContainText("e2e");

    await page.getByRole("combobox", { name: "Severidad" }).click();
    await page.getByRole("option", { name: "Media" }).click();

    await expect(byTestId(page, "audit-active-filters")).toContainText("Severidad: Media");
    await expect(byTestId(page, "audit-results-heading")).toContainText("1 evento(s) visibles");
    await expect(byTestId(page, "audit-log-audit-2")).toContainText("Venta registrada");
    await expect(byTestId(page, "audit-log-audit-1")).toHaveCount(0);

    await clickByTestId(page, "audit-clear-button");

    await fillByTestId(page, "audit-search", "password");
    await clickByTestId(page, "audit-consult-button");

    await expect(byTestId(page, "audit-log-audit-3")).toContainText("Contraseña restablecida");
    await expect(byTestId(page, "audit-log-audit-1")).toHaveCount(0);

    await clickByTestId(page, "audit-clear-button");

    await expect(byTestId(page, "audit-log-audit-1")).toBeVisible();
  });

  test("actividad de vendedores consulta eventos, filtra por acción y conserva búsqueda local", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/seller-activity");

    await expect(page.getByRole("heading", { name: "Actividad de vendedores", level: 1 })).toBeVisible();
    await expect(byTestId(page, "seller-activity-refresh-status")).toContainText("Auto-refresh activo");
    await expect(byTestId(page, "seller-activity-refresh-helper")).toContainText(
      "sin reiniciar búsqueda ni filtros",
    );
    await expect(byTestId(page, "seller-activity-last-updated")).toContainText("Actualizado");
    await expect(byTestId(page, "seller-activity-log-seller-activity-1")).toContainText(
      "Venta registrada por Vendedor E2E",
    );
    await expect(byTestId(page, "seller-activity-log-seller-activity-3")).toContainText(
      "Acceso bloqueado a Reportes",
    );
    await expect(byTestId(page, "seller-activity-shortcuts")).toContainText("Solo ventas");
    await expect(byTestId(page, "seller-activity-shortcuts")).toContainText("Accesos bloqueados");
    await expect(byTestId(page, "seller-activity-active-filters")).toContainText(
      "Acción: Todas las acciones",
    );
    await expect(byTestId(page, "seller-activity-results-heading")).toContainText(
      "3 de 3 movimientos visibles",
    );

    await clickByTestId(page, "seller-activity-quick-sales");
    await expect(byTestId(page, "seller-activity-active-filters")).toContainText(
      "Acción: Venta registrada",
    );
    await clickByTestId(page, "seller-activity-consult-button");

    await expect(byTestId(page, "seller-activity-log-seller-activity-1")).toBeVisible();
    await expect(byTestId(page, "seller-activity-log-seller-activity-3")).toHaveCount(0);

    await page.getByRole("combobox", { name: "Acción" }).click();
    await page.getByRole("option", { name: "Acceso bloqueado" }).click();
    await clickByTestId(page, "seller-activity-consult-button");

    await expect(byTestId(page, "seller-activity-log-seller-activity-3")).toBeVisible();
    await expect(byTestId(page, "seller-activity-log-seller-activity-1")).toHaveCount(0);

    await fillByTestId(page, "seller-activity-search", "127.0.0.2");

    await expect(byTestId(page, "seller-activity-log-seller-activity-3")).toContainText("127.0.0.2");
    await expect(byTestId(page, "seller-activity-search")).toHaveValue("127.0.0.2");

    await clickByTestId(page, "seller-activity-toggle-refresh-button");
    await expect(byTestId(page, "seller-activity-refresh-status")).toContainText("Auto-refresh pausado");
    await expect(byTestId(page, "seller-activity-refresh-helper")).toContainText(
      "sin perder filtros",
    );

    await clickByTestId(page, "seller-activity-refresh-now-button");

    await expect(byTestId(page, "seller-activity-search")).toHaveValue("127.0.0.2");
    await expect(byTestId(page, "seller-activity-log-seller-activity-3")).toBeVisible();

    await clickByTestId(page, "seller-activity-toggle-refresh-button");
    await expect(byTestId(page, "seller-activity-refresh-status")).toContainText("Auto-refresh activo");
  });
});
