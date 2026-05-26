import { describe, expect, it } from "vitest";

import { normalizeSearchText, valuesIncludeSearchText } from "./text";

describe("search text helpers", () => {
  it("normalizes case, whitespace and accents for local search", () => {
    expect(normalizeSearchText("  Café Molido  ")).toBe("cafe molido");
    expect(normalizeSearchText(null)).toBe("");
    expect(normalizeSearchText(12345)).toBe("12345");
  });

  it("matches searchable values using the same normalization rules", () => {
    expect(valuesIncludeSearchText(["José Pérez", "vendedor"], "jose")).toBe(true);
    expect(valuesIncludeSearchText(["Café 250 g", "SKU-001"], "cafe")).toBe(true);
    expect(valuesIncludeSearchText(["Coca-Cola"], "galleta")).toBe(false);
    expect(valuesIncludeSearchText(["Coca-Cola"], "   ")).toBe(true);
  });
});
