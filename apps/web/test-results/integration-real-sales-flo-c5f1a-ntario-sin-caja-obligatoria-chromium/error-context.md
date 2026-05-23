# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\real-sales-flow.spec.ts >> flujo integrado real de venta >> vendedor registra venta real y descuenta inventario sin caja obligatoria
- Location: e2e\integration\real-sales-flow.spec.ts:9:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Inicio', level: 1 })
Expected: visible
Timeout: 7500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 7500ms
  - waiting for getByRole('heading', { name: 'Inicio', level: 1 })

```

```yaml
- heading "Punta Venta" [level=4]
- paragraph: Inicia sesión para registrar ventas, consultar productos y administrar el punto de venta.
- separator
- alert: No se encontró el recurso solicitado.
- text: Correo electrónico
- textbox "Correo electrónico":
  - /placeholder: usuario@empresa.com
  - text: vendedor.e2e@puntaventa.test
- paragraph
- text: Contraseña
- textbox "Contraseña":
  - /placeholder: Escribe tu contraseña
  - text: Vendedor12345DevOnly
- paragraph
- button "Iniciar sesión"
- text: Usa la cuenta asignada por el administrador. Por seguridad, las sesiones se cierran desde el servidor.
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL ?? "vendedor.e2e@puntaventa.test";
  4  | const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD ?? "Vendedor12345DevOnly";
  5  | const PRODUCT_SKU = "E2E-COCA-600";
  6  | const CUSTOMER_NAME = `Cliente integrado ${Date.now()}`;
  7  | 
  8  | test.describe("flujo integrado real de venta", () => {
  9  |   test("vendedor registra venta real y descuenta inventario sin caja obligatoria", async ({ page }) => {
  10 |     await page.goto("/login");
  11 |     await page.getByLabel("Correo electrónico").fill(SELLER_EMAIL);
  12 |     await page.getByLabel("Contraseña").fill(SELLER_PASSWORD);
  13 |     await page.getByRole("button", { name: "Iniciar sesión" }).click();
  14 | 
> 15 |     await expect(page.getByRole("heading", { name: "Inicio", level: 1 })).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  16 | 
  17 |     await page.goto("/sales");
  18 |     await expect(page.getByRole("heading", { name: "Ventas", level: 1 })).toBeVisible();
  19 |     await expect(page.getByText("Vista vendedor: solo tus ventas")).toBeVisible();
  20 | 
  21 |     await page.getByLabel("F3 · Buscar por código, SKU o nombre").fill(PRODUCT_SKU);
  22 |     await page.getByRole("button", { name: /Producto integrado E2E/i }).click();
  23 | 
  24 |     await expect(page.getByText("Orden de venta")).toBeVisible();
  25 |     await expect(page.getByText(PRODUCT_SKU, { exact: true })).toBeVisible();
  26 |     await expect(page.getByText("$18.00").last()).toBeVisible();
  27 | 
  28 |     await page.getByLabel("Cliente opcional").fill(CUSTOMER_NAME);
  29 |     await page.getByLabel("Pago con").fill("20");
  30 |     await page.getByRole("button", { name: /Cobrar venta/i }).click();
  31 | 
  32 |     await expect(page.getByText("Venta registrada correctamente.")).toBeVisible();
  33 |     await expect(page.getByText(CUSTOMER_NAME)).toBeVisible();
  34 |     await expect(page.getByText(/SALE-\d{8}-[A-F0-9]{10}/)).toBeVisible();
  35 |     await expect(page.getByText("Escanea o busca un producto para iniciar la venta.")).toBeVisible();
  36 | 
  37 |     await page.goto("/inventory");
  38 |     await expect(page.getByRole("heading", { name: "Inventario", level: 1 })).toBeVisible();
  39 | 
  40 |     await page.getByLabel("Buscar existencias").fill(PRODUCT_SKU);
  41 |     await expect(
  42 |       page.getByRole("heading", { name: "Producto integrado E2E" }),
  43 |     ).toBeVisible();
  44 | 
  45 |     const stockCard = page
  46 |       .getByRole("heading", { name: "Producto integrado E2E" })
  47 |       .locator("..")
  48 |       .locator("..");
  49 | 
  50 |     await expect(stockCard.getByText(PRODUCT_SKU, { exact: true })).toBeVisible();
  51 |     await expect(stockCard.getByText("23 unidades")).toBeVisible();
  52 |   });
  53 | });
  54 | 
```