import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

const ROUTE_HEADING_TIMEOUT_MS = 15000;

const ADMIN_MODULES = [
  { path: "/", heading: "Inicio" },
  { path: "/products", heading: "Productos" },
  { path: "/inventory", heading: "Inventario" },
  { path: "/sales", heading: "Ventas" },
  { path: "/reports", heading: "Reportes" },
  { path: "/users", heading: "Usuarios y vendedores" },
  { path: "/audit", heading: "Auditoría" },
  { path: "/seller-activity", heading: "Actividad de vendedores" },
] as const;

test.describe("accesibilidad visual de módulos principales", () => {
  test("cada módulo administrativo expone main e h1 único", async ({ page }) => {
    await mockApi(page, { role: "ADMIN" });

    for (const module of ADMIN_MODULES) {
      await test.step(`${module.path} expone estructura semántica estable`, async () => {
        await page.goto(module.path);

        const main = page.getByRole("main");

        await expect(main).toBeVisible();
        await expect(
          main.getByRole("heading", { name: module.heading, level: 1 }),
        ).toBeVisible({ timeout: ROUTE_HEADING_TIMEOUT_MS });
        await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
      });
    }
  });
});
