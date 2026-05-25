import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";
import {
  byTestId,
  clickByTestId,
  fillByTestId,
  rowContaining,
} from "./support/e2e-locators";

test.describe("cobertura funcional de caja y permisos", () => {
  test("admin abre caja, registra movimiento manual y cierra corte", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    await page.goto("/cash-register");

    await expect(page.getByRole("heading", { name: "Caja", level: 1 })).toBeVisible();
    await expect(byTestId(page, "cash-status-chip")).toContainText("Sin caja abierta");
    await expect(byTestId(page, "cash-manual-submit")).toBeDisabled();
    await expect(page.getByText("Primero abre caja.").first()).toBeVisible();

    await fillByTestId(page, "cash-opening-amount", "100");
    await fillByTestId(page, "cash-opening-notes", "Apertura E2E");
    await clickByTestId(page, "cash-open-button");

    await expect(page.getByText("Caja abierta correctamente.")).toBeVisible();
    await expect(byTestId(page, "cash-status-chip")).toContainText("Caja abierta");
    await expect(page.getByText("Monto inicial: $100.00")).toBeVisible();
    await expect(page.getByText("Apertura E2E")).toBeVisible();

    await fillByTestId(page, "cash-manual-amount", "25");
    await fillByTestId(page, "cash-manual-reason", "Fondo adicional E2E");
    await clickByTestId(page, "cash-manual-submit");

    await expect(page.getByText("Movimiento de efectivo registrado correctamente.")).toBeVisible();
    await expect(rowContaining(page, "Fondo adicional E2E")).toContainText("Entrada manual");
    await expect(rowContaining(page, "Fondo adicional E2E")).toContainText("$25.00");

    await fillByTestId(page, "cash-closing-amount", "125");
    await fillByTestId(page, "cash-closing-notes", "Cierre E2E");
    await clickByTestId(page, "cash-close-button");

    await expect(page.getByText("Caja cerrada correctamente.")).toBeVisible();
    await expect(byTestId(page, "cash-status-chip")).toContainText("Sin caja abierta");
    await expect(rowContaining(page, "Admin E2E")).toContainText("Cerrada");
    await expect(rowContaining(page, "Admin E2E")).toContainText("$125.00");
  });

  test("vendedor sin permiso no accede a caja por ruta directa", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/cash-register");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Inicio", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Caja/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Caja", level: 1 })).toHaveCount(0);
  });
});
