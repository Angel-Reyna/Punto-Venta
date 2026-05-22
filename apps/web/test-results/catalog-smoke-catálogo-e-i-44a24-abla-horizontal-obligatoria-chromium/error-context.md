# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: catalog-smoke.spec.ts >> catálogo e inventario responsive >> inventario muestra existencias sin tabla horizontal obligatoria
- Location: e2e\catalog-smoke.spec.ts:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Inventario' })
Expected: visible
Timeout: 7500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 7500ms
  - waiting for getByRole('heading', { name: 'Inventario' })

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | import { mockApi } from "./support/api-mocks";
  4  | 
  5  | test.describe("catálogo e inventario responsive", () => {
  6  |   test("productos carga catálogo y permite buscar por SKU", async ({ page }) => {
  7  |     await mockApi(page, { role: "ADMIN" });
  8  | 
  9  |     await page.goto("/products");
  10 | 
  11 |     await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
  12 |     await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
  13 | 
  14 |     await page.getByLabel("Buscar productos").fill("COCA-600");
  15 | 
  16 |     await expect(page.getByText("COCA-600")).toBeVisible();
  17 |     await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
  18 |   });
  19 | 
  20 |   test("inventario muestra existencias sin tabla horizontal obligatoria", async ({ page }) => {
  21 |     await mockApi(page, { role: "ADMIN" });
  22 | 
  23 |     await page.goto("/inventory");
  24 | 
> 25 |     await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  26 |     await expect(page.getByText("Coca-Cola 600 ml")).toBeVisible();
  27 |     await expect(page.getByText("Principal")).toBeVisible();
  28 |   });
  29 | });
  30 | 
```