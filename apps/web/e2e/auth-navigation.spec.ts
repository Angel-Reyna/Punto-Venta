import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

test.describe("autenticación y navegación principal", () => {
  test("admin inicia sesión y ve módulos administrativos", async ({ page }) => {
    await mockApi(page, { role: "ADMIN", authenticated: false });

    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("admin@puntaventa.test");
    await page.getByLabel("Contraseña").fill("Admin12345DevOnly");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("dashboard-operational-hero")).toBeVisible();
    await expect(page.getByText("Pulso operativo")).toBeVisible();
    await expect(page.getByText("Administradores activos")).toBeVisible();
    await expect(page.getByText("Vendedores activos")).toBeVisible();
    await expect(page.getByText("Acciones rápidas")).toHaveCount(0);

    const userMetricButtons = page.getByRole("button", { name: "Ver usuarios" });
    await expect(userMetricButtons).toHaveCount(2);
    await expect(userMetricButtons.first()).toBeVisible();

    await expect(page.getByRole("link", { name: /Usuarios/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Reportes/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Auditoría/i })).toBeVisible();
  });

  test("vendedor no ve módulos administrativos ni puede entrar por ruta directa", async ({ page }) => {
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/users");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Inicio", level: 1 })).toBeVisible();
    await expect(page.getByText("Tu punto de partida para vender")).toBeVisible();
    await expect(page.getByRole("link", { name: /Usuarios/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Reportes/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Auditoría/i })).toHaveCount(0);
  });

  test("navegación móvil conserva accesos operativos sin depender solo del drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page, { role: "CASHIER" });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Inicio", level: 1 })).toBeVisible();

    const mobileNavigation = page.getByRole("navigation", { name: "Navegación principal móvil" });
    await expect(mobileNavigation.getByRole("link", { name: /Nueva venta/i })).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: /Inicio/i })).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: /Productos/i })).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: /Inventario/i })).toBeVisible();
  });
});
