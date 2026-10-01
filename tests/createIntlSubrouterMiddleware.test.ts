// @vitest-environment node
import createIntlMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { describe, expect, it } from "vitest";
import createIntlSubrouterMiddleware from "../src/utils/next-subrouter/createIntlSubrouterMiddleware";
import { makeRequest, rewrittenPath } from "./helpers";

const routes = [{ path: "/admin", subdomain: "admin" }, { path: "/app" }];
const routing = defineRouting({
  defaultLocale: "en",
  localePrefix: "as-needed",
  locales: ["en", "ja"],
});

function create(
  options: Partial<Parameters<typeof createIntlSubrouterMiddleware>[2]> = {},
): ReturnType<typeof createIntlSubrouterMiddleware> {
  return createIntlSubrouterMiddleware(routes, createIntlMiddleware(routing), {
    locales: routing.locales,
    ...options,
  });
}

describe("createIntlSubrouterMiddleware", () => {
  it("keeps an explicit locale in front of the route path", async () => {
    const response = await create()(
      makeRequest("admin.example.com", "/ja/users"),
    );

    expect(rewrittenPath(response)).toBe("/ja/admin/users");
    expect(response.headers.get("x-locale")).toBe("ja");
  });

  it("does not treat an unlisted segment as a locale", async () => {
    const response = await create()(makeRequest("admin.example.com", "/faq"));

    expect(rewrittenPath(response)).toBe("/en/admin/faq");
  });

  it("does not treat a segment after the locale as a locale", async () => {
    const response = await create()(
      makeRequest("admin.example.com", "/ja/faq"),
    );

    expect(rewrittenPath(response)).toBe("/ja/admin/faq");
  });

  it("adds the default locale on the root domain", async () => {
    const response = await create()(makeRequest("example.com", "/dashboard"));

    expect(rewrittenPath(response)).toBe("/en/app/dashboard");
  });

  it("keeps an explicit locale on the root domain", async () => {
    const response = await create()(
      makeRequest("example.com", "/ja/dashboard"),
    );

    expect(rewrittenPath(response)).toBe("/ja/app/dashboard");
  });

  it("supports rootDomain like example.co.uk", async () => {
    const response = await create({ rootDomain: "example.co.uk" })(
      makeRequest("admin.example.co.uk", "/users"),
    );

    expect(rewrittenPath(response)).toBe("/en/admin/users");
  });

  it("responds 404 for unknown subdomains with notFound", async () => {
    const middleware = create({ onUnknownSubdomain: "notFound" });

    expect(
      (await middleware(makeRequest("www.example.com", "/dashboard"))).status,
    ).toBe(404);
    expect(
      (await middleware(makeRequest("www.example.com", "/ja/dashboard")))
        .status,
    ).toBe(404);
  });

  it("falls back to the default route for unknown subdomains by default", async () => {
    const response = await create()(
      makeRequest("www.example.com", "/dashboard"),
    );

    expect(rewrittenPath(response)).toBe("/en/app/dashboard");
  });
});
