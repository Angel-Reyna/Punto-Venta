import { expect, test } from "@playwright/test";

import { mockApi } from "./support/api-mocks";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

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

test.describe("responsive visual de módulos principales", () => {
  test("los módulos administrativos no generan overflow horizontal en móvil", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await mockApi(page, { role: "ADMIN" });

    for (const module of ADMIN_MODULES) {
      await test.step(`${module.path} conserva ancho móvil`, async () => {
        await page.goto(module.path);

        const main = page.getByRole("main");

        await expect(main).toBeVisible();
        await expect(
          main.getByRole("heading", { name: module.heading, level: 1 }),
        ).toBeVisible();

        const horizontalOverflow = await page.evaluate(() => {
          const documentWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          );

          return documentWidth - window.innerWidth;
        });

        expect(horizontalOverflow).toBeLessThanOrEqual(2);
      });
    }
  });
});
