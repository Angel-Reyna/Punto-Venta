# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-navigation.spec.ts >> autenticación y navegación principal >> navegación móvil conserva accesos operativos sin depender solo del drawer
- Location: e2e\auth-navigation.spec.ts:34:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Inicio' })
Expected: visible
Timeout: 7500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 7500ms
  - waiting for getByRole('heading', { name: 'Inicio' })

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | import { mockApi } from "./support/api-mocks";
  4  | 
  5  | test.describe("autenticación y navegación principal", () => {
  6  |   test("admin inicia sesión y ve módulos administrativos", async ({ page }) => {
  7  |     await mockApi(page, { role: "ADMIN", authenticated: false });
  8  | 
  9  |     await page.goto("/login");
  10 |     await page.getByLabel("Correo electrónico").fill("admin@puntaventa.test");
  11 |     await page.getByLabel("Contraseña").fill("Admin12345DevOnly");
  12 |     await page.getByRole("button", { name: "Iniciar sesión" }).click();
  13 | 
  14 |     await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  15 |     await expect(page.getByText("Usuarios activos")).toBeVisible();
  16 |     await expect(page.getByRole("link", { name: /Usuarios/i })).toBeVisible();
  17 |     await expect(page.getByRole("link", { name: /Reportes/i })).toBeVisible();
  18 |     await expect(page.getByRole("link", { name: /Auditoría/i })).toBeVisible();
  19 |   });
  20 | 
  21 |   test("vendedor no ve módulos administrativos ni puede entrar por ruta directa", async ({ page }) => {
  22 |     await mockApi(page, { role: "CASHIER" });
  23 | 
  24 |     await page.goto("/users");
  25 | 
  26 |     await expect(page).toHaveURL(/\/$/);
  27 |     await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  28 |     await expect(page.getByText("Panel para registrar ventas")).toBeVisible();
  29 |     await expect(page.getByRole("link", { name: /Usuarios/i })).toHaveCount(0);
  30 |     await expect(page.getByRole("link", { name: /Reportes/i })).toHaveCount(0);
  31 |     await expect(page.getByRole("link", { name: /Auditoría/i })).toHaveCount(0);
  32 |   });
  33 | 
  34 |   test("navegación móvil conserva accesos operativos sin depender solo del drawer", async ({ page }) => {
  35 |     await page.setViewportSize({ width: 390, height: 844 });
  36 |     await mockApi(page, { role: "CASHIER" });
  37 | 
  38 |     await page.goto("/");
  39 | 
> 40 |     await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  41 |     await expect(page.getByRole("link", { name: /Nueva venta/i })).toBeVisible();
  42 |     await expect(page.getByRole("link", { name: /Inicio/i })).toBeVisible();
  43 |     await expect(page.getByRole("link", { name: /Productos/i })).toBeVisible();
  44 |     await expect(page.getByRole("link", { name: /Inventario/i })).toBeVisible();
  45 |   });
  46 | });
  47 | 
```