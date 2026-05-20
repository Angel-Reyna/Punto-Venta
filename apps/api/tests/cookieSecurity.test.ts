import { resolveRefreshCookieSecurity } from "../src/config/cookieSecurity";

describe("resolveRefreshCookieSecurity", () => {
  it("uses restrictive development defaults", () => {
    expect(
      resolveRefreshCookieSecurity({
        nodeEnv: "development"
      })
    ).toEqual({
      secure: false,
      sameSite: "lax"
    });
  });

  it("preserves the current production default for cross-site deployments", () => {
    expect(
      resolveRefreshCookieSecurity({
        nodeEnv: "production"
      })
    ).toEqual({
      secure: true,
      sameSite: "none"
    });
  });

  it("allows explicit same-site production deployments behind a single domain", () => {
    expect(
      resolveRefreshCookieSecurity({
        nodeEnv: "production",
        cookieSecure: true,
        cookieSameSite: "lax",
        cookieDomain: "  punta-venta.example.com  "
      })
    ).toEqual({
      secure: true,
      sameSite: "lax",
      domain: "punta-venta.example.com"
    });
  });

  it("rejects SameSite=None without Secure", () => {
    expect(() =>
      resolveRefreshCookieSecurity({
        nodeEnv: "development",
        cookieSecure: false,
        cookieSameSite: "none"
      })
    ).toThrow("COOKIE_SAME_SITE=none requiere COOKIE_SECURE=true");
  });
});
