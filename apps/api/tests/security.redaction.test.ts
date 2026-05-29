import { Prisma } from "@prisma/client";

import { REDACTED_VALUE, redactSensitiveInputJson } from "../src/utils/redaction";

describe("security redaction", () => {
  it("redacts sensitive keys before values are stored or exposed", () => {
    const result = redactSensitiveInputJson({
      email: "vendedor@pos.local",
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
      password: "plain-password",
      passwordHash: "hashed-password",
      nested: {
        csrfToken: "csrf-token-value",
        safe: "visible"
      },
      items: [
        {
          secret: "hidden",
          sku: "SKU-1"
        }
      ]
    });

    expect(result).toEqual({
      email: "vendedor@pos.local",
      accessToken: REDACTED_VALUE,
      refreshToken: REDACTED_VALUE,
      password: REDACTED_VALUE,
      passwordHash: REDACTED_VALUE,
      nested: {
        csrfToken: REDACTED_VALUE,
        safe: "visible"
      },
      items: [
        {
          secret: REDACTED_VALUE,
          sku: "SKU-1"
        }
      ]
    });
  });

  it("keeps operational numeric and descriptive data intact", () => {
    const result = redactSensitiveInputJson({
      productId: "product-1",
      quantity: 2,
      unitPrice: 150,
      grossProfit: 75,
      paymentMethod: "CASH",
      reason: "Venta mostrador"
    });

    expect(result).toEqual({
      productId: "product-1",
      quantity: 2,
      unitPrice: 150,
      grossProfit: 75,
      paymentMethod: "CASH",
      reason: "Venta mostrador"
    });
  });

  it("serializes Prisma decimals and dates into JSON-compatible audit data", () => {
    const result = redactSensitiveInputJson({
      costPrice: new Prisma.Decimal("11.50"),
      salePrice: new Prisma.Decimal("21.25"),
      createdAt: new Date("2026-05-29T12:00:00.000Z"),
      nested: {
        grossProfit: new Prisma.Decimal("9.75")
      }
    });

    expect(result).toEqual({
      costPrice: "11.5",
      salePrice: "21.25",
      createdAt: "2026-05-29T12:00:00.000Z",
      nested: {
        grossProfit: "9.75"
      }
    });
  });
});
