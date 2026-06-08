import type { Locator, Page } from "@playwright/test";

type LocatorRoot = Locator | Page;

export function byTestId(root: LocatorRoot, testId: string): Locator {
  return root.getByTestId(testId);
}

export async function fillByTestId(
  root: LocatorRoot,
  testId: string,
  value: string,
): Promise<void> {
  await byTestId(root, testId).fill(value);
}

export async function clickByTestId(
  root: LocatorRoot,
  testId: string,
): Promise<void> {
  await byTestId(root, testId).click();
}

export async function activateByTestId(
  root: LocatorRoot,
  testId: string,
): Promise<void> {
  const target = byTestId(root, testId);

  await target.focus();
  await target.press("Enter");
}

export function salesHistorySale(page: Page, saleId: string): Locator {
  return byTestId(page, `sales-history-sale-${saleId}`);
}

export function inventoryStockItem(page: Page, sku: string): Locator {
  return byTestId(page, `inventory-stock-item-${sku}`);
}

export function reportMetric(page: Page, metricId: string): Locator {
  return byTestId(page, `reports-metric-${metricId}`);
}

export function inventoryTransferRequest(page: Page, requestId: string): Locator {
  return byTestId(page, `inventory-transfer-request-${requestId}`);
}

export function salesAdjustmentRequest(page: Page, requestId: string): Locator {
  return byTestId(page, `sales-adjustment-request-${requestId}`);
}

export function dialogByName(page: Page, name: string | RegExp): Locator {
  return page.getByRole("dialog", { name });
}

export function rowContaining(root: LocatorRoot, text: string | RegExp): Locator {
  return root.getByRole("row").filter({ hasText: text }).first();
}
