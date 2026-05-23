import { expect, test } from "@playwright/test";

const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL ?? "vendedor.e2e@puntaventa.test";
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD ?? "Vendedor12345DevOnly";
const PRODUCT_SKU = "E2E-COCA-600";
const CUSTOMER_NAME = `Cliente integrado ${Date.now()}`;

test.describe("flujo integrado real de venta", () => {
  test("vendedor registra venta real y descuenta inventario sin caja obligatoria", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(SELLER_EMAIL);
    await page.getByLabel("Contraseña").fill(SELLER_PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByRole("heading", { name: "Inicio", level: 1 })).toBeVisible();

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
    await expect(page.getByText(/SALE-\d{8}-[A-F0-9]{10}/)).toBeVisible();
    await expect(page.getByText("Escanea o busca un producto para iniciar la venta.")).toBeVisible();

    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();

    await page.getByLabel("Buscar existencias").fill(PRODUCT_SKU);
    await expect(
      page.getByRole("heading", { name: "Producto integrado E2E" }),
    ).toBeVisible();

    const stockCard = page
      .getByRole("heading", { name: "Producto integrado E2E" })
      .locator("..")
      .locator("..");

    await expect(stockCard.getByText(PRODUCT_SKU, { exact: true })).toBeVisible();
    await expect(stockCard.getByText("23 unidades")).toBeVisible();
  });
});
