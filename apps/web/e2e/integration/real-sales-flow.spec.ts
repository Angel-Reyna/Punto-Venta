import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? "admin.e2e@puntaventa.test";
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? "Admin12345DevOnly";
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL ?? "vendedor.e2e@puntaventa.test";
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD ?? "Vendedor12345DevOnly";
const SELLER_NAME = process.env.E2E_SELLER_NAME ?? "Vendedor E2E";
const PRODUCT_SKU = "E2E-COCA-600";
const PRODUCT_NAME = "Producto integrado E2E";
const CUSTOMER_NAME = `Cliente integrado ${Date.now()}`;
const SALE_FOLIO_PATTERN = /SALE-\d{8}-[A-F0-9]{10}/;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByRole("heading", { name: "Inicio", level: 1 })).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
}

async function readCreatedSaleFolio(page: Page) {
  const folioLocator = page.getByText(SALE_FOLIO_PATTERN).first();

  await expect(folioLocator).toBeVisible();

  const folioText = await folioLocator.textContent();
  const folio = folioText?.match(SALE_FOLIO_PATTERN)?.[0];

  expect(folio, "Se esperaba un folio de venta generado por el backend real.").toBeTruthy();

  return folio as string;
}

test.describe("flujo integrado real de venta", () => {
  test("vendedor registra venta real, descuenta inventario y admin la valida en reportes", async ({ page }) => {
    await login(page, SELLER_EMAIL, SELLER_PASSWORD);

    await page.goto("/sales");
    await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();
    await expect(page.getByText("Vista vendedor: solo tus ventas")).toBeVisible();

    await page.getByLabel("F3 · Buscar por código, SKU o nombre").fill(PRODUCT_SKU);
    await page.getByRole("button", { name: /Producto integrado E2E/i }).click();

    await expect(page.getByText("Orden de venta")).toBeVisible();
    await expect(page.getByText(PRODUCT_SKU, { exact: true })).toBeVisible();
    await expect(page.getByText("$18.00").last()).toBeVisible();

    await page.getByLabel("Cliente opcional").fill(CUSTOMER_NAME);
    await page.getByLabel("Pago con").fill("20");
    await page.getByRole("button", { name: /Cobrar venta/i }).click();

    await expect(page.getByText("Venta registrada correctamente.")).toBeVisible();
    await expect(page.getByText(CUSTOMER_NAME)).toBeVisible();

    const saleFolio = await readCreatedSaleFolio(page);

    await expect(page.getByText("Escanea o busca un producto para iniciar la venta.")).toBeVisible();

    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();

    await page.getByLabel("Buscar existencias").fill(PRODUCT_SKU);
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();

    const stockCard = page
      .getByRole("heading", { name: PRODUCT_NAME })
      .locator("..")
      .locator("..");

    await expect(stockCard.getByText(PRODUCT_SKU, { exact: true })).toBeVisible();
    await expect(stockCard.getByText("23 unidades")).toBeVisible();

    await logout(page);
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Reportes", level: 1 })).toBeVisible();
    await expect(page.getByText("Reporte operativo ADMIN")).toBeVisible();

    await page.getByRole("button", { name: "Consultar reporte" }).click();

    const sellerReport = page.getByRole("region", { name: "Ventas por vendedor" });
    const statusReport = page.getByRole("region", { name: "Estados y métodos" });
    const productsReport = page.getByRole("region", { name: "Productos más vendidos" });
    const recentSalesReport = page.getByRole("region", { name: "Ventas recientes" });

    await expect(sellerReport).toBeVisible();
    await expect(productsReport).toBeVisible();
    await expect(recentSalesReport).toBeVisible();
    await expect(statusReport.getByText("Completada: 1")).toBeVisible();
    await expect(statusReport.getByText("Efectivo: $18.00")).toBeVisible();
    await expect(sellerReport.getByText(SELLER_EMAIL)).toBeVisible();
    await expect(productsReport.getByText(PRODUCT_NAME)).toBeVisible();

    await page.getByLabel("Buscar dentro del reporte").fill(saleFolio);

    await expect(recentSalesReport.getByText(saleFolio, { exact: true })).toBeVisible();
    await expect(recentSalesReport.getByText(`${SELLER_NAME} (${SELLER_EMAIL})`)).toBeVisible();
    await expect(recentSalesReport.getByText("Efectivo $18.00")).toBeVisible();
  });
});
