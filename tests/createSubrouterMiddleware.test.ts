import { describe, expect, it } from "vitest";
import createSubrouterMiddleware from "../src/utils/next-subrouter/createSubrouterMiddleware";

function makeRequest(host: string, pathname: string) {
  const url = new URL(`https://${host}${pathname}`);
  return {
    headers: new Headers({ host }),
    nextUrl: {
      pathname,
      clone() {
        const u = new URL(url.toString());
        return { pathname: u.pathname, toString: () => u.toString() };
      },
    },
  } as unknown as import("next/server").NextRequest;
}

describe("createSubrouterMiddleware", () => {
  it("validates duplicate paths at creation time", () => {
    expect(() =>
      createSubrouterMiddleware([
        { path: "/dashboard", subdomain: "admin" },
        { path: "/dashboard", subdomain: "internal" },
      ]),
    ).toThrow(/Duplicate path/);
  });

  it("validates duplicate subdomains at creation time", () => {
    expect(() =>
      createSubrouterMiddleware([
        { path: "/dashboard", subdomain: "admin" },
        { path: "/admin", subdomain: "admin" },
      ]),
    ).toThrow(/Duplicate subdomain/);
  });

  it("returns a function", () => {
    const mw = createSubrouterMiddleware([
      { path: "/dashboard", subdomain: "admin" },
      { path: "/blog" },
    ]);
    expect(typeof mw).toBe("function");
  });
});
